# 🚀 Complete Supabase Setup Guide

Follow these steps exactly to get your database working with Setique.

## Step 1: Create Your Supabase Account (2 minutes)

1. Go to **https://supabase.com**
2. Click **"Start your project"** or **"Sign In"**
3. Sign up with **GitHub** (easiest) or your email
4. Verify your email if prompted

## Step 2: Create a New Project (3 minutes)

1. Once logged in, click **"New Project"** (green button)
2. Fill in the details:
   - **Organization**: Select or create one
   - **Name**: `setique-marketplace` (or whatever you prefer)
   - **Database Password**: Create a STRONG password
     - ⚠️ **IMPORTANT**: Save this password somewhere safe!
     - Example: `MySecurePass123!@#`
   - **Region**: Choose the closest to you (e.g., East US, West US, Europe)
   - **Pricing Plan**: **Free** (plenty for starting out)
3. Click **"Create new project"**
4. **WAIT 2-3 MINUTES** - Don't close the page! The database is being set up.
5. You'll see a dashboard when it's ready

## Step 3: Get Your API Keys (1 minute)

1. In your project dashboard, look at the left sidebar
2. Click the **⚙️ Settings** icon (gear icon at bottom)
3. Click **"API"** in the settings menu
4. You'll see two important values:

### Copy These Values:

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```
Copy the entire URL

**anon/public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M....(very long string)
```
Copy the entire key (it's long!)

### ⚠️ Keep These Safe!
Save them in a text file temporarily - you'll need them in Step 5.

## Step 4: Set Up Your Database (5 minutes)

Now we'll create all the tables your app needs.

### 4a. Open the SQL Editor

1. In the left sidebar, click **</> SQL Editor**
2. Click **"+ New query"** button (top right)

### 4b. Run the First Migration (Main Database Structure)

1. Copy **ALL** the SQL below
2. Paste it into the SQL Editor
3. Click **"Run"** or press **Ctrl+Enter**
4. You should see: ✅ **"Success. No rows returned"**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create datasets table
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  modality TEXT NOT NULL,
  accent_color TEXT DEFAULT 'bg-yellow-200',
  schema_fields TEXT[] DEFAULT '{}',
  sample_data TEXT,
  notes TEXT,
  download_url TEXT,
  file_size BIGINT,
  purchase_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  dataset_id UUID REFERENCES datasets(id) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, dataset_id)
);

-- Create bounties table
CREATE TABLE bounties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  modality TEXT NOT NULL,
  quantity TEXT,
  file_formats TEXT,
  annotation_type TEXT,
  labels TEXT[] DEFAULT '{}',
  budget NUMERIC(10,2) NOT NULL CHECK (budget >= 0),
  deadline DATE,
  licensing TEXT,
  acceptance_criteria TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bounty submissions table
CREATE TABLE bounty_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID REFERENCES bounties(id) NOT NULL,
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  dataset_id UUID REFERENCES datasets(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_datasets_creator ON datasets(creator_id);
CREATE INDEX idx_datasets_tags ON datasets USING GIN(tags);
CREATE INDEX idx_datasets_price ON datasets(price);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_dataset ON purchases(dataset_id);
CREATE INDEX idx_bounties_creator ON bounties(creator_id);
CREATE INDEX idx_bounties_status ON bounties(status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounty_submissions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Datasets policies
CREATE POLICY "Datasets are viewable by everyone"
  ON datasets FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create datasets"
  ON datasets FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own datasets"
  ON datasets FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own datasets"
  ON datasets FOR DELETE
  USING (auth.uid() = creator_id);

-- Purchases policies
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert purchases"
  ON purchases FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view datasets they purchased"
  ON datasets FOR SELECT
  USING (
    id IN (
      SELECT dataset_id FROM purchases
      WHERE user_id = auth.uid() AND status = 'completed'
    )
  );

-- Bounties policies
CREATE POLICY "Bounties are viewable by everyone"
  ON bounties FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create bounties"
  ON bounties FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own bounties"
  ON bounties FOR UPDATE
  USING (auth.uid() = creator_id);

-- Bounty submissions policies
CREATE POLICY "Users can view own submissions"
  ON bounty_submissions FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Bounty creators can view submissions"
  ON bounty_submissions FOR SELECT
  USING (
    bounty_id IN (
      SELECT id FROM bounties WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create submissions"
  ON bounty_submissions FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON datasets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bounties_updated_at BEFORE UPDATE ON bounties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4c. Verify the Tables Were Created

1. In the left sidebar, click **🗄️ Table Editor**
2. You should see these tables:
   - ✅ profiles
   - ✅ datasets
   - ✅ purchases
   - ✅ bounties
   - ✅ bounty_submissions

If you see all of them, you're good! 🎉

## Step 5: Update Your .env File (2 minutes)

Now let's put your real API keys into your app.

### 5a. Open Your .env File

1. In VS Code or any text editor, open: `C:\Users\iixii\OneDrive\Desktop\SETIQUE\.env`

### 5b. Replace the Placeholder Values

Replace this:
```env
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...placeholder
```

With your REAL values from Step 3:
```env
VITE_SUPABASE_URL=https://YOUR_ACTUAL_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ACTUAL_LONG_KEY_HERE
```

### 5c. Save the File

Save and close the `.env` file.

## Step 6: Restart Your App (1 minute)

1. In your PowerShell terminal, press **Ctrl+C** to stop the server
2. Run: `npm run dev`
3. Open your browser to **http://localhost:3001** (or whatever port it says)

## Step 7: Test It! (2 minutes)

### Create Your First User

1. Click **"Sign In"** in the top right
2. Click **"Sign Up"** at the bottom of the modal
3. Fill in:
   - **Username**: testuser (or whatever you want)
   - **Email**: your-email@example.com (use a real email!)
   - **Password**: at least 6 characters
4. Click **"Sign Up"**
5. Check your email for a verification link
6. Click the verification link

### You Should Now Be Able To:
- ✅ Sign in and sign out
- ✅ Browse the marketplace (empty at first)
- ✅ Create new datasets
- ✅ Post bounties

## Step 8: Add Sample Data (OPTIONAL - 1 minute)

Want some example datasets to play with?

1. Go back to Supabase SQL Editor
2. Click **"+ New query"**
3. Copy and paste this SQL:

```sql
-- Insert sample datasets
-- Note: This will only work if you have at least one user profile!

INSERT INTO datasets (creator_id, title, description, tags, price, modality, accent_color, schema_fields, sample_data, notes)
SELECT 
  id,
  'A Photographic Archive of Brutalist Architecture in Pittsburgh',
  '400+ high-resolution photos of Pittsburgh''s brutalist landmarks, annotated with architect, year, and material data.',
  ARRAY['vision', 'architecture', 'pittsburgh'],
  149,
  'vision',
  'bg-yellow-200',
  ARRAY['image_id', 'building_name', 'architect', 'year_built', 'materials'],
  'IMG_2025_CMU_WeanHall.jpg, Wean Hall, Yount & Sullivan, 1971, [concrete, steel]',
  'All photos shot professionally in RAW format, available upon request.'
FROM profiles
LIMIT 1;

INSERT INTO datasets (creator_id, title, description, tags, price, modality, accent_color, schema_fields, sample_data, notes)
SELECT 
  id,
  'Audio Library of Antique Mechanical Keyboards',
  '50 unique recordings of rare mechanical keyboards, from the IBM Model M to the Alps ''Bigfoot''. Each keypress is isolated.',
  ARRAY['audio', 'niche', 'vintage tech'],
  79,
  'audio',
  'bg-cyan-200',
  ARRAY['keyboard_model', 'switch_type', 'year', 'sound_file'],
  'IBM Model M, Buckling Spring, 1986, ibm_model_m_typing.wav',
  'Recorded with a Neumann U 87 Ai microphone in a soundproofed environment.'
FROM profiles
LIMIT 1;

INSERT INTO datasets (creator_id, title, description, tags, price, modality, accent_color, schema_fields, sample_data, notes)
SELECT 
  id,
  'A Lexicon of 1980s Skateboarder Slang',
  'A curated text file of over 1,500 slang terms used by skateboarders in the 1980s, with definitions and examples.',
  ARRAY['text', 'nlp', 'subculture'],
  59,
  'text',
  'bg-pink-200',
  ARRAY['term', 'definition', 'example_sentence', 'region'],
  'rad, adj., an expression of approval, ''That new Vision board is so rad.''',
  'Compiled from original source material like Thrasher Magazine and skate videos from the era.'
FROM profiles
LIMIT 1;

INSERT INTO datasets (creator_id, title, description, tags, price, modality, accent_color, schema_fields, sample_data, notes)
SELECT 
  id,
  '50k Urban Street-Sign Images (COCO-annotated)',
  'Multi-city, day/night, weather-varied dataset for robust object detection models that need real-world grit.',
  ARRAY['vision', 'coco', 'detection'],
  129,
  'vision',
  'bg-yellow-200',
  ARRAY['image_id', 'bbox', 'class', 'city', 'lighting', 'weather'],
  'img_10444.jpg, [231,44,88,88], STOP, Austin, night, clear',
  'Privacy-compliant with blurred faces and obfuscated license plates.'
FROM profiles
LIMIT 1;

INSERT INTO datasets (creator_id, title, description, tags, price, modality, accent_color, schema_fields, sample_data, notes)
SELECT 
  id,
  'Encyclopedia of North American Diner Pancakes',
  '5,000+ images of pancakes from diners across the US & Canada, annotated for fluffiness, toppings, and plate aesthetics.',
  ARRAY['vision', 'food', 'niche'],
  119,
  'vision',
  'bg-yellow-200',
  ARRAY['image_id', 'diner_name', 'city', 'fluffiness_score', 'toppings'],
  'pancake_001.jpg, Lou''s Diner, Pittsburgh, PA, 8.5, [butter, syrup]',
  'Every pancake tells a story. No waffles allowed.'
FROM profiles
LIMIT 1;

INSERT INTO datasets (creator_id, title, description, tags, price, modality, accent_color, schema_fields, sample_data, notes)
SELECT 
  id,
  '8k Household Actions (Video Clips, 1080p)',
  'Short clips of everyday actions (open fridge, pour water). Essential for training embodied AI and robotics.',
  ARRAY['video', 'actions', 'robotics'],
  149,
  'video',
  'bg-yellow-200',
  ARRAY['video_id', 'start_frame', 'end_frame', 'verb_class', 'objects_present'],
  'vid_2021.mp4, 93, 171, pour_water, [pitcher, glass]',
  'Includes camera pose data for a subset of clips, enabling 3D analysis.'
FROM profiles
LIMIT 1;

-- Insert sample bounties
INSERT INTO bounties (creator_id, title, description, modality, quantity, budget, status)
SELECT 
  id,
  'Recordings of Different Types of Rain',
  'Need high-quality audio recordings of various types of rain: light drizzle, heavy downpour, thunderstorm, etc.',
  'audio',
  '5 hours',
  250,
  'active'
FROM profiles
LIMIT 1;

INSERT INTO bounties (creator_id, title, description, modality, quantity, budget, status)
SELECT 
  id,
  'Positive Customer Support Chat Logs',
  'Looking for transcripts of positive customer support interactions for training sentiment analysis models.',
  'text',
  '10,000 lines',
  800,
  'active'
FROM profiles
LIMIT 1;
```

4. Click **"Run"**
5. Refresh your app - you should see 6 datasets and 2 bounties!

## 🎉 You're Done!

Your Supabase database is now fully set up and connected to your app!

### What You Can Do Now:
- ✅ Sign up and sign in
- ✅ Browse real datasets
- ✅ Create your own datasets
- ✅ Post bounties
- ✅ Search and filter

### What Still Needs Setup (Optional):
- 💳 **Stripe** - For actual payments (see SETUP_GUIDE.md Part 3)
- 🌐 **Netlify** - For deploying live (see SETUP_GUIDE.md Part 6)

## Troubleshooting

### "Error: No rows returned" after running sample data SQL
- You need to create a user account first (Step 7)
- Then run the sample data SQL

### Can't sign up - email error
- Check that your email is valid
- Check your spam folder for the verification email

### Tables don't appear
- Make sure the SQL ran successfully
- Check for error messages in red
- Try refreshing the Table Editor page

### App still shows errors
- Make sure you saved the .env file
- Make sure you restarted the dev server (Ctrl+C, then npm run dev)
- Check that you copied the FULL Supabase keys (they're very long!)

## Need Help?

If something isn't working:
1. Check the error message in your browser console (F12)
2. Check the Supabase Logs (in your project dashboard)
3. Make sure all environment variables are correct
4. Try restarting the dev server

---

**Congratulations!** Your database is live and your app is fully functional! 🚀
