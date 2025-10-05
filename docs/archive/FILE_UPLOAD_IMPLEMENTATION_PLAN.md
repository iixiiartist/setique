# Platform Enhancement: File Upload & Download Security

## ✅ Completed: Option 1 - Clean Up Categories

**What was done:**
- Removed "Architecture" and "Subculture" from filter dropdown
- Now only shows actual data modalities: Vision, Audio, Text, NLP, Video
- These can still be used as tags by creators

**Commit:** `8c73299` - "Clean up: Remove Architecture and Subculture from filter - keep only valid modalities"

---

## 🚧 In Progress: Options 2 & 3

### Option 2: Add Supabase Storage Integration

#### What This Adds:
- Direct file upload from creator form
- Automatic file hosting in Supabase Storage
- File type validation
- File size limits
- Automatic download URL generation

#### Implementation Steps:

**1. Create Supabase Storage Bucket**
```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', false);

-- Set up RLS policies for the bucket
CREATE POLICY "Authenticated users can upload datasets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'datasets');

CREATE POLICY "Anyone can download purchased datasets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'datasets');

CREATE POLICY "Creators can update own datasets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Creators can delete own datasets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**2. Update HomePage.jsx Creator Form**

Add file upload field:
```jsx
// Add state
const [uploadFile, setUploadFile] = useState(null)
const [uploadProgress, setUploadProgress] = useState(0)

// Add upload handler
const handleFileUpload = async (file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('datasets')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      onUploadProgress: (progress) => {
        setUploadProgress((progress.loaded / progress.total) * 100)
      }
    })
  
  if (error) throw error
  return fileName
}

// Update handlePublish
const handlePublish = async () => {
  // ... existing code ...
  
  let downloadUrl = newDownloadUrl
  
  if (uploadFile) {
    const fileName = await handleFileUpload(uploadFile)
    const { data } = supabase.storage
      .from('datasets')
      .getPublicUrl(fileName)
    downloadUrl = data.publicUrl
  }
  
  // ... rest of existing code ...
}
```

Add to JSX:
```jsx
<div>
  <label className="font-bold mb-2 block">Upload Dataset File</label>
  <input
    type="file"
    onChange={(e) => setUploadFile(e.target.files[0])}
    className="w-full bg-white border-2 border-black rounded-md p-3"
    accept=".csv,.json,.zip,.tar.gz,.mp4,.mp3,.wav"
  />
  {uploadProgress > 0 && (
    <div className="mt-2">
      <div className="bg-gray-200 rounded-full h-2">
        <div 
          className="bg-black h-2 rounded-full transition-all"
          style={{ width: `${uploadProgress}%` }}
        />
      </div>
      <p className="text-sm mt-1">{uploadProgress.toFixed(0)}% uploaded</p>
    </div>
  )}
</div>
```

**3. File Type Validation**
```jsx
const ALLOWED_FILE_TYPES = {
  vision: ['.jpg', '.jpeg', '.png', '.zip', '.tar.gz'],
  audio: ['.mp3', '.wav', '.flac', '.zip'],
  video: ['.mp4', '.mov', '.avi', '.zip'],
  text: ['.csv', '.json', '.txt', '.zip'],
  nlp: ['.csv', '.json', '.txt', '.zip']
}

const validateFile = (file, modality) => {
  const ext = '.' + file.name.split('.').pop().toLowerCase()
  const allowedExts = ALLOWED_FILE_TYPES[modality] || []
  
  if (!allowedExts.includes(ext)) {
    throw new Error(`File type ${ext} not allowed for ${modality} datasets`)
  }
  
  // 500MB max
  if (file.size > 500 * 1024 * 1024) {
    throw new Error('File size must be under 500MB')
  }
}
```

---

### Option 3: Add Download Security with Signed URLs

#### What This Adds:
- Expiring download links (24 hours)
- Access control (only purchasers can download)
- Prevents link sharing
- Tracks download attempts

#### Implementation Steps:

**1. Create Download Function**

Create `netlify/functions/generate-download.js`:
```javascript
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Need to add this!
  )
  
  const { datasetId, userId } = JSON.parse(event.body)
  
  // Verify purchase
  const { data: purchase } = await supabase
    .from('purchases')
    .select('*')
    .eq('dataset_id', datasetId)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .single()
  
  if (!purchase) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'No valid purchase found' })
    }
  }
  
  // Get dataset
  const { data: dataset } = await supabase
    .from('datasets')
    .select('download_url')
    .eq('id', datasetId)
    .single()
  
  // Generate signed URL (24 hour expiry)
  const { data, error } = await supabase.storage
    .from('datasets')
    .createSignedUrl(dataset.download_url, 86400) // 24 hours
  
  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ downloadUrl: data.signedUrl })
  }
}
```

**2. Add Service Role Key to Netlify**

In Netlify Dashboard → Environment Variables, add:
```
SUPABASE_SERVICE_ROLE_KEY = [Your service role key from Supabase]
```

**3. Update Frontend Download Logic**

In HomePage.jsx, update the download button:
```jsx
const handleDownload = async (datasetId) => {
  setProcessing(true)
  try {
    const response = await fetch('/.netlify/functions/generate-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasetId, userId: user.id })
    })
    
    const { downloadUrl } = await response.json()
    
    // Open download in new tab
    window.open(downloadUrl, '_blank')
  } catch (error) {
    alert('Download failed: ' + error.message)
  } finally {
    setProcessing(false)
  }
}
```

**4. Update Database Schema**

Add download tracking:
```sql
CREATE TABLE download_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  dataset_id UUID REFERENCES datasets(id) NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_download_logs_user ON download_logs(user_id);
CREATE INDEX idx_download_logs_dataset ON download_logs(dataset_id);
```

---

## 📋 Implementation Checklist

### Phase 1: Supabase Storage Setup
- [ ] Create `datasets` bucket in Supabase Dashboard
- [ ] Set up RLS policies for bucket
- [ ] Test manual file upload in Supabase UI

### Phase 2: Frontend File Upload
- [ ] Add file input to creator form
- [ ] Add upload progress indicator
- [ ] Add file type validation
- [ ] Update handlePublish to upload file
- [ ] Test end-to-end upload flow

### Phase 3: Download Security
- [ ] Create `generate-download` Netlify Function
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to Netlify env vars
- [ ] Create `download_logs` table in database
- [ ] Update frontend download logic
- [ ] Test download access control

### Phase 4: Testing
- [ ] Test: Creator uploads file successfully
- [ ] Test: File appears in Supabase Storage
- [ ] Test: Purchaser can download
- [ ] Test: Non-purchaser cannot download
- [ ] Test: Download link expires after 24 hours
- [ ] Test: Large file upload (100MB+)
- [ ] Test: Invalid file type rejection

---

## 🎯 Benefits After Implementation

**Security:**
- ✅ No more shareable download links
- ✅ Only verified purchasers can download
- ✅ Links expire after 24 hours
- ✅ Download attempts logged

**User Experience:**
- ✅ Creators upload directly in the platform
- ✅ No need for external file hosting
- ✅ Automatic file management
- ✅ Upload progress feedback

**Platform Control:**
- ✅ File type validation
- ✅ File size limits
- ✅ Storage management
- ✅ Download analytics

---

## 🚀 Ready to Implement?

This is a significant enhancement that will take approximately:
- **Setup:** 30 minutes (Supabase storage + policies)
- **Frontend:** 1-2 hours (file upload UI + validation)
- **Backend:** 1 hour (download function + security)
- **Testing:** 1 hour (end-to-end testing)

**Total estimated time:** 3-4 hours

Would you like me to start implementing these features now?
