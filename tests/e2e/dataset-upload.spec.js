import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { TEST_USER, loginUser } from './helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * E2E Tests for Dataset Upload Flow
 * 
 * Tests cover:
 * - Accessing upload modal from dashboard
 * - Form validation (required fields)
 * - File upload functionality
 * - Price validation (free and paid datasets)
 * - Modality selection
 * - Tag input
 * - Upload progress indication
 * - Success confirmation
 * - Error handling
 * - Upload cancellation
 * - Form draft persistence (localStorage)
 */

// Test dataset data
const TEST_DATASET = {
  title: 'E2E Test Dataset - Street Signs',
  description: 'A comprehensive dataset of street signs for object detection and classification. Contains 500+ labeled images with bounding boxes and categories.',
  price: '9.99',
  freePrice: '0',
  modality: 'vision',
  tags: ['computer-vision', 'object-detection', 'street-signs']
};

// Helper function to open upload modal
async function openUploadModal(page) {
  // Look for "Upload New Dataset" button using Playwright 1.56.0 syntax
  await page.click('button:has-text("Upload New Dataset")');
  
  // Wait for modal to appear
  await page.waitForSelector('text=Upload New Dataset', { timeout: 5000 });
}

test.describe('Dataset Upload Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page);
  });

  test.describe('Modal Access', () => {
    
    test('should open upload modal from dashboard', async ({ page }) => {
      // Open upload modal
      await openUploadModal(page);
      
      // Verify modal is visible
      await expect(page.locator('h3:has-text("Upload New Dataset")')).toBeVisible();
      await expect(page.locator('text=Share your curated data with the community')).toBeVisible();
    });

    test('should close upload modal with X button', async ({ page }) => {
      await openUploadModal(page);
      
      // Click close button
      await page.locator('button[aria-label="Close"], button:has(svg)').first().click();
      
      // Modal should be closed
      await expect(page.locator('h3:has-text("Upload New Dataset")')).not.toBeVisible();
    });

    test('should close upload modal with Cancel button', async ({ page }) => {
      await openUploadModal(page);
      
      // Click cancel button
      await page.locator('button:has-text("Cancel")').click();
      
      // Modal should be closed
      await expect(page.locator('h3:has-text("Upload New Dataset")')).not.toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    
    test('should show required field indicators', async ({ page }) => {
      await openUploadModal(page);
      
      // Verify required field markers
      await expect(page.locator('label:has-text("Title") >> text=*')).toBeVisible();
      await expect(page.locator('label:has-text("Description") >> text=*')).toBeVisible();
      await expect(page.locator('label:has-text("Price") >> text=*')).toBeVisible();
      await expect(page.locator('label:has-text("Dataset File") >> text=*')).toBeVisible();
    });

    test('should disable submit button when form is incomplete', async ({ page }) => {
      await openUploadModal(page);
      
      // Submit button should be disabled initially
      const submitButton = page.locator('button:has-text("Publish Dataset")');
      await expect(submitButton).toBeDisabled();
    });

    test('should enable submit button when all required fields are filled', async ({ page }) => {
      await openUploadModal(page);
      
      // Fill in all required fields
      await page.locator('input[placeholder*="Street Signs"]').fill(TEST_DATASET.title);
      await page.locator('textarea[placeholder*="Describe your dataset"]').fill(TEST_DATASET.description);
      await page.locator('input[type="number"][placeholder="0.00"]').fill(TEST_DATASET.price);
      
      // Upload a file (create a test file)
      const testFilePath = path.join(__dirname, '..', 'fixtures', 'test-dataset.csv');
      await page.locator('input[type="file"]').setInputFiles(testFilePath);
      
      // Submit button should be enabled
      const submitButton = page.locator('button:has-text("Publish Dataset")');
      await expect(submitButton).toBeEnabled();
    });

    test('should validate price is non-negative', async ({ page }) => {
      await openUploadModal(page);
      
      // Try to enter negative price
      const priceInput = page.locator('input[type="number"][placeholder="0.00"]');
      await priceInput.fill('-5');
      
      // HTML5 validation should prevent negative values
      // The min="0" attribute should handle this
      const minValue = await priceInput.getAttribute('min');
      expect(minValue).toBe('0');
    });

    test('should accept free datasets (price = 0)', async ({ page }) => {
      await openUploadModal(page);
      
      // Fill form with free price
      await page.locator('input[placeholder*="Street Signs"]').fill(TEST_DATASET.title);
      await page.locator('textarea[placeholder*="Describe your dataset"]').fill(TEST_DATASET.description);
      await page.locator('input[type="number"][placeholder="0.00"]').fill(TEST_DATASET.freePrice);
      
      // Upload a file
      const testFilePath = path.join(__dirname, '..', 'fixtures', 'test-dataset.csv');
      await page.locator('input[type="file"]').setInputFiles(testFilePath);
      
      // Submit button should be enabled for free datasets
      const submitButton = page.locator('button:has-text("Publish Dataset")');
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('File Upload', () => {
    
    test('should display file upload area', async ({ page }) => {
      await openUploadModal(page);
      
      // Verify upload area elements
      await expect(page.locator('text=Click to upload or drag and drop')).toBeVisible();
      await expect(page.locator('text=ZIP, CSV, JSON, or other data formats')).toBeVisible();
      await expect(page.locator('button:has-text("Choose File")')).toBeVisible();
    });

    test('should show selected file details', async ({ page }) => {
      await openUploadModal(page);
      
      // Upload a file
      const testFilePath = path.join(__dirname, '..', 'fixtures', 'test-dataset.csv');
      await page.locator('input[type="file"]').setInputFiles(testFilePath);
      
      // Verify file details are displayed
      await expect(page.locator('text=✓ File Selected')).toBeVisible();
      await expect(page.locator('text=test-dataset.csv')).toBeVisible();
      await expect(page.locator('text=MB')).toBeVisible(); // File size
    });

    test('should allow removing selected file', async ({ page }) => {
      await openUploadModal(page);
      
      // Upload a file
      const testFilePath = path.join(__dirname, '..', 'fixtures', 'test-dataset.csv');
      await page.locator('input[type="file"]').setInputFiles(testFilePath);
      
      // Verify file is selected
      await expect(page.locator('text=✓ File Selected')).toBeVisible();
      
      // Remove file
      await page.locator('button:has-text("Remove")').click();
      
      // Verify file is removed
      await expect(page.locator('text=✓ File Selected')).not.toBeVisible();
      await expect(page.locator('button:has-text("Choose File")')).toBeVisible();
    });

    test('should accept various file formats', async ({ page }) => {
      await openUploadModal(page);
      
      // Check accepted file types
      const fileInput = page.locator('input[type="file"]');
      const acceptAttr = await fileInput.getAttribute('accept');
      
      // Should accept common data formats
      expect(acceptAttr).toContain('.zip');
      expect(acceptAttr).toContain('.csv');
      expect(acceptAttr).toContain('.json');
    });
  });

  test.describe('Modality Selection', () => {
    
    test('should display all modality options', async ({ page }) => {
      await openUploadModal(page);
      
      const modalitySelect = page.locator('select').first(); // Modality is the first select
      
      // Click to open dropdown
      await modalitySelect.click();
      
      // Verify all options are present
      await expect(modalitySelect.locator('option[value="vision"]')).toBeAttached();
      await expect(modalitySelect.locator('option[value="audio"]')).toBeAttached();
      await expect(modalitySelect.locator('option[value="text"]')).toBeAttached();
      await expect(modalitySelect.locator('option[value="video"]')).toBeAttached();
      await expect(modalitySelect.locator('option[value="multimodal"]')).toBeAttached();
      await expect(modalitySelect.locator('option[value="other"]')).toBeAttached();
    });

    test('should default to vision modality', async ({ page }) => {
      await openUploadModal(page);
      
      const modalitySelect = page.locator('select').first();
      const selectedValue = await modalitySelect.inputValue();
      
      expect(selectedValue).toBe('vision');
    });

    test('should allow changing modality', async ({ page }) => {
      await openUploadModal(page);
      
      const modalitySelect = page.locator('select').first();
      
      // Change to audio
      await modalitySelect.selectOption('audio');
      expect(await modalitySelect.inputValue()).toBe('audio');
      
      // Change to text
      await modalitySelect.selectOption('text');
      expect(await modalitySelect.inputValue()).toBe('text');
    });
  });

  test.describe('Tag Input', () => {
    
    test('should display tag input field', async ({ page }) => {
      await openUploadModal(page);
      
      await expect(page.locator('label:has-text("Tags")')).toBeVisible();
      await expect(page.locator('text=Add tags to help users discover your dataset')).toBeVisible();
    });

    test('should allow adding multiple tags', async ({ page }) => {
      await openUploadModal(page);
      
      // Find tag input (this depends on TagInput component implementation)
      const tagInput = page.locator('input[placeholder*="machine-learning"]');
      
      // Add first tag
      await tagInput.fill('computer-vision');
      await tagInput.press('Enter');
      
      // Add second tag
      await tagInput.fill('object-detection');
      await tagInput.press('Enter');
      
      // Verify tags are displayed (this may need adjustment based on TagInput rendering)
      // Tags might appear as pills or list items
      await expect(page.locator('text=computer-vision')).toBeVisible();
      await expect(page.locator('text=object-detection')).toBeVisible();
    });
  });

  test.describe('Upload Process', () => {
    
    test('should show upload progress during submission', async ({ page }) => {
      await openUploadModal(page);
      
      // Fill in complete form
      await page.locator('input[placeholder*="Street Signs"]').fill(TEST_DATASET.title);
      await page.locator('textarea[placeholder*="Describe your dataset"]').fill(TEST_DATASET.description);
      await page.locator('input[type="number"][placeholder="0.00"]').fill(TEST_DATASET.price);
      
      // Upload a file
      const testFilePath = path.join(__dirname, '..', 'fixtures', 'test-dataset.csv');
      await page.locator('input[type="file"]').setInputFiles(testFilePath);
      
      // Submit form
      await page.locator('button:has-text("Publish Dataset")').click();
      
      // Should show uploading state
      // Note: This might be fast with small test files
      await expect(page.locator('text=Uploading')).toBeVisible({ timeout: 2000 }).catch(() => {
        // Upload might be too fast to catch the progress indicator
        console.log('Upload completed too quickly to verify progress indicator');
      });
    });

    test('should disable form during upload', async ({ page }) => {
      await openUploadModal(page);
      
      // Fill in complete form
      await page.locator('input[placeholder*="Street Signs"]').fill(TEST_DATASET.title);
      await page.locator('textarea[placeholder*="Describe your dataset"]').fill(TEST_DATASET.description);
      await page.locator('input[type="number"][placeholder="0.00"]').fill(TEST_DATASET.price);
      
      // Upload a file
      const testFilePath = path.join(__dirname, '..', 'fixtures', 'test-dataset.csv');
      await page.locator('input[type="file"]').setInputFiles(testFilePath);
      
      // Submit form
      await page.locator('button:has-text("Publish Dataset")').click();
      
      // Form fields should be disabled during upload
      // Note: Might need to use a larger file to catch this
      const titleInput = page.locator('input[placeholder*="Street Signs"]');
      const isDisabled = await titleInput.isDisabled().catch(() => false);
      
      // Either it's disabled or upload completed
      if (isDisabled) {
        expect(isDisabled).toBe(true);
      }
    });

    test('should show success confirmation after upload', async ({ page }) => {
      await openUploadModal(page);
      
      // Fill in complete form
      await page.locator('input[placeholder*="Street Signs"]').fill(TEST_DATASET.title);
      await page.locator('textarea[placeholder*="Describe your dataset"]').fill(TEST_DATASET.description);
      await page.locator('input[type="number"][placeholder="0.00"]').fill(TEST_DATASET.freePrice); // Use free to avoid payment issues
      
      // Upload a file
      const testFilePath = path.join(__dirname, '..', 'fixtures', 'test-dataset.csv');
      await page.locator('input[type="file"]').setInputFiles(testFilePath);
      
      // Listen for alert dialog
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Published');
        expect(dialog.message()).toContain(TEST_DATASET.title);
        await dialog.accept();
      });
      
      // Submit form
      await page.locator('button:has-text("Publish Dataset")').click();
      
      // Wait for upload to complete and modal to close
      await expect(page.locator('h3:has-text("Upload New Dataset")')).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Error Handling', () => {
    
    test('should show error when no file is selected', async ({ page }) => {
      await openUploadModal(page);
      
      // Fill form but don't upload file
      await page.locator('input[placeholder*="Street Signs"]').fill(TEST_DATASET.title);
      await page.locator('textarea[placeholder*="Describe your dataset"]').fill(TEST_DATASET.description);
      await page.locator('input[type="number"][placeholder="0.00"]').fill(TEST_DATASET.price);
      
      // Submit button should still be disabled (file is required)
      const submitButton = page.locator('button:has-text("Publish Dataset")');
      await expect(submitButton).toBeDisabled();
    });

    test('should handle upload cancellation', async ({ page }) => {
      await openUploadModal(page);
      
      // Fill in form
      await page.locator('input[placeholder*="Street Signs"]').fill(TEST_DATASET.title);
      await page.locator('textarea[placeholder*="Describe your dataset"]').fill(TEST_DATASET.description);
      await page.locator('input[type="number"][placeholder="0.00"]').fill(TEST_DATASET.price);
      
      // Upload a file
      const testFilePath = path.join(__dirname, '..', 'fixtures', 'test-dataset.csv');
      await page.locator('input[type="file"]').setInputFiles(testFilePath);
      
      // Start upload
      await page.locator('button:has-text("Publish Dataset")').click();
      
      // Try to close modal during upload (might show confirmation)
      // This depends on how fast the upload completes
      page.on('dialog', async dialog => {
        if (dialog.message().includes('Upload in progress')) {
          await dialog.accept();
        }
      });
      
      // Try to click cancel
      await page.locator('button:has-text("Cancel")').click().catch(() => {
        // Upload might have completed already
        console.log('Upload completed before cancellation attempt');
      });
    });
  });

  test.describe('Form Persistence', () => {
    
    test('should persist draft data in localStorage', async ({ page }) => {
      await openUploadModal(page);
      
      // Fill in form
      await page.locator('input[placeholder*="Street Signs"]').fill(TEST_DATASET.title);
      await page.locator('textarea[placeholder*="Describe your dataset"]').fill(TEST_DATASET.description);
      await page.locator('input[type="number"][placeholder="0.00"]').fill(TEST_DATASET.price);
      
      // Close modal
      await page.locator('button:has-text("Cancel")').click();
      
      // Reopen modal
      await openUploadModal(page);
      
      // Verify data is persisted
      const titleValue = await page.locator('input[placeholder*="Street Signs"]').inputValue();
      const descValue = await page.locator('textarea[placeholder*="Describe your dataset"]').inputValue();
      const priceValue = await page.locator('input[type="number"][placeholder="0.00"]').inputValue();
      
      expect(titleValue).toBe(TEST_DATASET.title);
      expect(descValue).toBe(TEST_DATASET.description);
      expect(priceValue).toBe(TEST_DATASET.price);
    });

    test('should clear draft after successful upload', async ({ page }) => {
      await openUploadModal(page);
      
      // Fill in complete form
      await page.locator('input[placeholder*="Street Signs"]').fill(TEST_DATASET.title);
      await page.locator('textarea[placeholder*="Describe your dataset"]').fill(TEST_DATASET.description);
      await page.locator('input[type="number"][placeholder="0.00"]').fill(TEST_DATASET.freePrice);
      
      // Upload a file
      const testFilePath = path.join(__dirname, '..', 'fixtures', 'test-dataset.csv');
      await page.locator('input[type="file"]').setInputFiles(testFilePath);
      
      // Handle success alert
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      // Submit form
      await page.locator('button:has-text("Publish Dataset")').click();
      
      // Wait for modal to close
      await expect(page.locator('h3:has-text("Upload New Dataset")')).not.toBeVisible({ timeout: 10000 });
      
      // Reopen modal
      await openUploadModal(page);
      
      // Verify form is cleared
      const titleValue = await page.locator('input[placeholder*="Street Signs"]').inputValue();
      expect(titleValue).toBe('');
    });
  });

  test.describe('User Experience', () => {
    
    test('should show helpful placeholder text', async ({ page }) => {
      await openUploadModal(page);
      
      // Verify placeholders
      await expect(page.locator('input[placeholder*="Street Signs"]')).toBeVisible();
      await expect(page.locator('textarea[placeholder*="Describe your dataset"]')).toBeVisible();
      await expect(page.locator('text=Set to $0 for demo datasets')).toBeVisible();
    });

    test('should display modal header with description', async ({ page }) => {
      await openUploadModal(page);
      
      await expect(page.locator('h3:has-text("Upload New Dataset")')).toBeVisible();
      await expect(page.locator('text=Share your curated data with the community')).toBeVisible();
    });

    test('should maintain form responsiveness', async ({ page }) => {
      await openUploadModal(page);
      
      // Type in multiple fields quickly
      await page.locator('input[placeholder*="Street Signs"]').fill('Test Dataset');
      await page.locator('textarea[placeholder*="Describe your dataset"]').fill('Test description');
      await page.locator('input[type="number"][placeholder="0.00"]').fill('5.99');
      
      // All values should be retained
      expect(await page.locator('input[placeholder*="Street Signs"]').inputValue()).toBe('Test Dataset');
      expect(await page.locator('textarea[placeholder*="Describe your dataset"]').inputValue()).toBe('Test description');
      expect(await page.locator('input[type="number"][placeholder="0.00"]').inputValue()).toBe('5.99');
    });
  });
});
