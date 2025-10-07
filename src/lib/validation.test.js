import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePrice,
  validateFile,
  validateFileSize,
  validateUrl,
  validateRequired,
  validateDatasetTitle,
  validateDatasetDescription,
  validateUsername
} from './validation';

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toEqual({ valid: true });
    expect(validateEmail('test.user@domain.co.uk')).toEqual({ valid: true });
    expect(validateEmail('name+tag@example.org')).toEqual({ valid: true });
    expect(validateEmail('  user@example.com  ')).toEqual({ valid: true }); // Trims whitespace
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid-email')).toMatchObject({ valid: false });
    expect(validateEmail('missing@domain')).toMatchObject({ valid: false });
    expect(validateEmail('@nodomain.com')).toMatchObject({ valid: false });
    expect(validateEmail('no-at-sign.com')).toMatchObject({ valid: false });
    expect(validateEmail('spaces in@email.com')).toMatchObject({ valid: false });
  });

  it('should reject empty or missing email', () => {
    expect(validateEmail('')).toMatchObject({ valid: false, error: 'Email is required' });
    expect(validateEmail('   ')).toMatchObject({ valid: false, error: 'Email is required' });
    expect(validateEmail(null)).toMatchObject({ valid: false, error: 'Email is required' });
    expect(validateEmail(undefined)).toMatchObject({ valid: false, error: 'Email is required' });
  });

  it('should reject non-string values', () => {
    expect(validateEmail(123)).toMatchObject({ valid: false, error: 'Email is required' });
    expect(validateEmail({})).toMatchObject({ valid: false, error: 'Email is required' });
    expect(validateEmail([])).toMatchObject({ valid: false, error: 'Email is required' });
  });

  it('should provide helpful error messages', () => {
    const result = validateEmail('not-valid');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });
});

describe('validatePrice', () => {
  it('should accept valid prices', () => {
    expect(validatePrice(9.99)).toEqual({ valid: true });
    expect(validatePrice('19.99')).toEqual({ valid: true });
    expect(validatePrice(0)).toEqual({ valid: true }); // Allow zero by default
    expect(validatePrice('0')).toEqual({ valid: true });
    expect(validatePrice(100)).toEqual({ valid: true });
  });

  it('should accept zero when allowZero is true', () => {
    expect(validatePrice(0, { allowZero: true })).toEqual({ valid: true });
    expect(validatePrice('0.00', { allowZero: true })).toEqual({ valid: true });
  });

  it('should reject zero when allowZero is false', () => {
    expect(validatePrice(0, { allowZero: false })).toMatchObject({ 
      valid: false, 
      error: 'Price must be greater than 0' 
    });
    expect(validatePrice('0', { allowZero: false })).toMatchObject({ valid: false });
  });

  it('should reject negative prices', () => {
    expect(validatePrice(-5)).toMatchObject({ valid: false, error: 'Price cannot be negative' });
    expect(validatePrice('-10.50')).toMatchObject({ valid: false, error: 'Price cannot be negative' });
  });

  it('should reject prices exceeding max price', () => {
    expect(validatePrice(1000, { maxPrice: 500 })).toMatchObject({ 
      valid: false, 
      error: 'Price cannot exceed $500' 
    });
    expect(validatePrice('999999.99', { maxPrice: 1000 })).toMatchObject({ valid: false });
  });

  it('should reject empty or missing price', () => {
    expect(validatePrice('')).toMatchObject({ valid: false, error: 'Price is required' });
    expect(validatePrice(null)).toMatchObject({ valid: false, error: 'Price is required' });
    expect(validatePrice(undefined)).toMatchObject({ valid: false, error: 'Price is required' });
  });

  it('should reject non-numeric values', () => {
    expect(validatePrice('abc')).toMatchObject({ valid: false, error: 'Price must be a valid number' });
    expect(validatePrice('$19.99')).toMatchObject({ valid: false });
    expect(validatePrice('twenty')).toMatchObject({ valid: false });
  });

  it('should handle string numbers correctly', () => {
    expect(validatePrice('25.50')).toEqual({ valid: true });
    expect(validatePrice('100')).toEqual({ valid: true });
  });
});

describe('validateFile', () => {
  // Helper to create mock File objects
  const createMockFile = (name, size, type) => {
    // Create a Blob with the correct size first
    const content = new Uint8Array(size);
    const blob = new Blob([content], { type });
    // Create File from Blob to ensure size is respected
    return new File([blob], name, { type });
  };

  describe('vision modality', () => {
    it('should accept valid image files', () => {
      const jpegFile = createMockFile('image.jpg', 1024, 'image/jpeg');
      expect(validateFile(jpegFile, 'vision')).toEqual({ valid: true });

      const pngFile = createMockFile('image.png', 2048, 'image/png');
      expect(validateFile(pngFile, 'vision')).toEqual({ valid: true });
    });

    it('should accept zip files', () => {
      const zipFile = createMockFile('dataset.zip', 10240, 'application/zip');
      expect(validateFile(zipFile, 'vision')).toEqual({ valid: true });
    });

    it('should reject invalid file types', () => {
      const txtFile = createMockFile('data.txt', 1024, 'text/plain');
      const result = validateFile(txtFile, 'vision');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });
  });

  describe('audio modality', () => {
    it('should accept valid audio files', () => {
      const mp3File = createMockFile('audio.mp3', 5120, 'audio/mpeg');
      expect(validateFile(mp3File, 'audio')).toEqual({ valid: true });

      const wavFile = createMockFile('audio.wav', 8192, 'audio/wav');
      expect(validateFile(wavFile, 'audio')).toEqual({ valid: true });
    });

    it('should reject invalid file types', () => {
      const imgFile = createMockFile('image.jpg', 1024, 'image/jpeg');
      expect(validateFile(imgFile, 'audio')).toMatchObject({ valid: false });
    });
  });

  describe('text modality', () => {
    it('should accept valid text files', () => {
      const csvFile = createMockFile('data.csv', 2048, 'text/csv');
      expect(validateFile(csvFile, 'text')).toEqual({ valid: true });

      const jsonFile = createMockFile('data.json', 1024, 'application/json');
      expect(validateFile(jsonFile, 'text')).toEqual({ valid: true });
    });
  });

  describe('video modality', () => {
    it('should accept valid video files', () => {
      const mp4File = createMockFile('video.mp4', 102400, 'video/mp4');
      expect(validateFile(mp4File, 'video')).toEqual({ valid: true });
    });
  });

  describe('nlp modality', () => {
    it('should accept valid NLP files', () => {
      const csvFile = createMockFile('corpus.csv', 4096, 'text/csv');
      expect(validateFile(csvFile, 'nlp')).toEqual({ valid: true });
    });
  });

  describe('file size validation', () => {
    it('should accept files under max size', () => {
      const smallFile = createMockFile('small.jpg', 1024 * 1024, 'image/jpeg'); // 1MB
      expect(validateFile(smallFile, 'vision')).toEqual({ valid: true });
    });

    it('should reject files over max size', () => {
      const largeFile = createMockFile('huge.jpg', 600 * 1024 * 1024, 'image/jpeg'); // 600MB
      const result = validateFile(largeFile, 'vision');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
      expect(result.error).toContain('500MB');
    });

    it('should respect custom max size', () => {
      const file = createMockFile('test.jpg', 10 * 1024 * 1024, 'image/jpeg'); // 10MB
      const result = validateFile(file, 'vision', { maxSize: 5 * 1024 * 1024 }); // 5MB limit
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });
  });

  describe('edge cases', () => {
    it('should reject missing file', () => {
      expect(validateFile(null, 'vision')).toMatchObject({ 
        valid: false, 
        error: 'File is required' 
      });
      expect(validateFile(undefined, 'vision')).toMatchObject({ valid: false });
    });

    it('should reject invalid file object', () => {
      expect(validateFile({}, 'vision')).toMatchObject({ 
        valid: false, 
        error: 'Invalid file object' 
      });
      expect(validateFile('not-a-file', 'vision')).toMatchObject({ valid: false });
    });

    it('should reject invalid modality', () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      expect(validateFile(file, 'invalid')).toMatchObject({ 
        valid: false, 
        error: 'Invalid modality specified' 
      });
      expect(validateFile(file, '')).toMatchObject({ valid: false });
    });

    it('should accept files with empty type (some browsers)', () => {
      const file = createMockFile('data.zip', 1024, '');
      expect(validateFile(file, 'vision')).toEqual({ valid: true });
    });
  });
});

describe('validateFileSize', () => {
  it('should accept valid file sizes', () => {
    expect(validateFileSize(1024)).toEqual({ valid: true }); // 1KB
    expect(validateFileSize(1024 * 1024)).toEqual({ valid: true }); // 1MB
    expect(validateFileSize(0)).toEqual({ valid: true }); // Empty file
  });

  it('should reject sizes exceeding max', () => {
    const result = validateFileSize(600 * 1024 * 1024); // 600MB
    expect(result.valid).toBe(false);
    expect(result.error).toContain('File too large');
  });

  it('should respect custom max size', () => {
    expect(validateFileSize(10 * 1024 * 1024, { maxSize: 5 * 1024 * 1024 })).toMatchObject({ 
      valid: false 
    });
  });

  it('should respect custom min size', () => {
    expect(validateFileSize(100, { minSize: 1024 })).toMatchObject({ 
      valid: false,
      error: 'File size must be at least 1024 bytes'
    });
  });

  it('should reject invalid sizes', () => {
    expect(validateFileSize(-1)).toMatchObject({ valid: false, error: 'Invalid file size' });
    expect(validateFileSize('not-a-number')).toMatchObject({ valid: false });
    expect(validateFileSize(null)).toMatchObject({ valid: false });
  });
});

describe('validateUrl', () => {
  it('should accept valid URLs', () => {
    expect(validateUrl('http://example.com')).toEqual({ valid: true });
    expect(validateUrl('https://example.com')).toEqual({ valid: true });
    expect(validateUrl('https://subdomain.example.com/path?query=value')).toEqual({ valid: true });
    expect(validateUrl('  https://example.com  ')).toEqual({ valid: true }); // Trims whitespace
  });

  it('should accept http when https not required', () => {
    expect(validateUrl('http://example.com')).toEqual({ valid: true });
    expect(validateUrl('http://example.com', { requireHttps: false })).toEqual({ valid: true });
  });

  it('should reject http when https required', () => {
    const result = validateUrl('http://example.com', { requireHttps: true });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('URL must use HTTPS protocol');
  });

  it('should reject invalid URLs', () => {
    expect(validateUrl('not-a-url')).toMatchObject({ valid: false, error: 'Invalid URL format' });
    expect(validateUrl('ftp://example.com')).toMatchObject({ valid: false });
    expect(validateUrl('//example.com')).toMatchObject({ valid: false });
    expect(validateUrl('example.com')).toMatchObject({ valid: false });
  });

  it('should reject empty or missing URL', () => {
    expect(validateUrl('')).toMatchObject({ valid: false, error: 'URL is required' });
    expect(validateUrl('   ')).toMatchObject({ valid: false, error: 'URL is required' });
    expect(validateUrl(null)).toMatchObject({ valid: false, error: 'URL is required' });
  });

  it('should reject non-string values', () => {
    expect(validateUrl(123)).toMatchObject({ valid: false, error: 'URL is required' });
    expect(validateUrl({})).toMatchObject({ valid: false });
  });
});

describe('validateRequired', () => {
  it('should accept non-empty strings', () => {
    expect(validateRequired('hello', 'Field')).toEqual({ valid: true });
    expect(validateRequired('  text  ', 'Field')).toEqual({ valid: true }); // Trims whitespace
  });

  it('should reject empty strings', () => {
    expect(validateRequired('', 'Field')).toMatchObject({ 
      valid: false, 
      error: 'Field cannot be empty' 
    });
    expect(validateRequired('   ', 'Field')).toMatchObject({ valid: false });
  });

  it('should reject null or undefined', () => {
    expect(validateRequired(null, 'Field')).toMatchObject({ 
      valid: false, 
      error: 'Field is required' 
    });
    expect(validateRequired(undefined, 'Field')).toMatchObject({ valid: false });
  });

  it('should reject non-string values', () => {
    expect(validateRequired(123, 'Field')).toMatchObject({ 
      valid: false, 
      error: 'Field must be a string' 
    });
    expect(validateRequired({}, 'Field')).toMatchObject({ valid: false });
  });

  it('should respect min length', () => {
    expect(validateRequired('hi', 'Field', { minLength: 3 })).toMatchObject({ 
      valid: false,
      error: 'Field must be at least 3 characters'
    });
    expect(validateRequired('hello', 'Field', { minLength: 3 })).toEqual({ valid: true });
  });

  it('should respect max length', () => {
    expect(validateRequired('this is a very long text', 'Field', { maxLength: 10 })).toMatchObject({ 
      valid: false,
      error: 'Field must not exceed 10 characters'
    });
    expect(validateRequired('short', 'Field', { maxLength: 10 })).toEqual({ valid: true });
  });

  it('should use custom field name in error messages', () => {
    const result = validateRequired('', 'Username');
    expect(result.error).toContain('Username');
  });
});

describe('validateDatasetTitle', () => {
  it('should accept valid titles', () => {
    expect(validateDatasetTitle('ImageNet Dataset')).toEqual({ valid: true });
    expect(validateDatasetTitle('Machine Learning Training Data')).toEqual({ valid: true });
  });

  it('should reject titles that are too short', () => {
    expect(validateDatasetTitle('AI')).toMatchObject({ 
      valid: false,
      error: 'Dataset title must be at least 3 characters'
    });
  });

  it('should reject titles that are too long', () => {
    const longTitle = 'A'.repeat(201);
    expect(validateDatasetTitle(longTitle)).toMatchObject({ 
      valid: false,
      error: 'Dataset title must not exceed 200 characters'
    });
  });

  it('should reject empty titles', () => {
    expect(validateDatasetTitle('')).toMatchObject({ valid: false });
    expect(validateDatasetTitle('   ')).toMatchObject({ valid: false });
  });
});

describe('validateDatasetDescription', () => {
  it('should accept valid descriptions', () => {
    const desc = 'This is a comprehensive dataset containing various samples for machine learning.';
    expect(validateDatasetDescription(desc)).toEqual({ valid: true });
  });

  it('should reject descriptions that are too short', () => {
    expect(validateDatasetDescription('Too short')).toMatchObject({ 
      valid: false,
      error: 'Dataset description must be at least 10 characters'
    });
  });

  it('should reject descriptions that are too long', () => {
    const longDesc = 'A'.repeat(2001);
    expect(validateDatasetDescription(longDesc)).toMatchObject({ 
      valid: false,
      error: 'Dataset description must not exceed 2000 characters'
    });
  });

  it('should reject empty descriptions', () => {
    expect(validateDatasetDescription('')).toMatchObject({ valid: false });
  });
});

describe('validateUsername', () => {
  it('should accept valid usernames', () => {
    expect(validateUsername('john_doe')).toEqual({ valid: true });
    expect(validateUsername('user123')).toEqual({ valid: true });
    expect(validateUsername('test-user')).toEqual({ valid: true });
    expect(validateUsername('abc')).toEqual({ valid: true }); // Minimum 3 chars
  });

  it('should reject usernames that are too short', () => {
    expect(validateUsername('ab')).toMatchObject({ 
      valid: false,
      error: 'Username must be at least 3 characters'
    });
  });

  it('should reject usernames that are too long', () => {
    const longUsername = 'a'.repeat(31);
    expect(validateUsername(longUsername)).toMatchObject({ 
      valid: false,
      error: 'Username must not exceed 30 characters'
    });
  });

  it('should reject usernames with invalid characters', () => {
    expect(validateUsername('user@domain')).toMatchObject({ 
      valid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens'
    });
    expect(validateUsername('user name')).toMatchObject({ valid: false }); // No spaces
    expect(validateUsername('user.name')).toMatchObject({ valid: false }); // No dots
    expect(validateUsername('user!name')).toMatchObject({ valid: false }); // No special chars
  });

  it('should reject empty usernames', () => {
    expect(validateUsername('')).toMatchObject({ valid: false });
    expect(validateUsername('   ')).toMatchObject({ valid: false });
  });

  it('should reject null or undefined', () => {
    expect(validateUsername(null)).toMatchObject({ valid: false });
    expect(validateUsername(undefined)).toMatchObject({ valid: false });
  });
});
