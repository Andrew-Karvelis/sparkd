import { v4 as uuidv4 } from 'uuid';

/**
 * Downloads an image from a URL and returns it as a buffer
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generates a unique filename for an image
 */
export function generateImageFilename(theme: string, userId?: string): string {
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0]; // Use first part of UUID for shorter filename
  const userPrefix = userId ? `${userId}_` : '';
  return `${userPrefix}${theme}_${timestamp}_${uuid}.jpg`;
}

/**
 * Saves image buffer to local storage (for development)
 * In production, you'd want to use cloud storage like AWS S3 or Cloudinary
 */
export async function saveImageLocally(
  imageBuffer: Buffer, 
  filename: string
): Promise<string> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
  
  // Save the file
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, imageBuffer);
  
  // Return the public URL
  return `/uploads/${filename}`;
}

export async function saveImageToCloud(
  imageBuffer: Buffer,
  filename: string,
  userId?: string
): Promise<string> {

  return saveImageLocally(imageBuffer, filename);
}

/**
 * Main function to download and store a generated image
 */
export async function storeGeneratedImage(
  imageUrl: string,
  theme: string,
  userId?: string
): Promise<string> {
  try {
    // Download the image from OpenAI
    const imageBuffer = await downloadImage(imageUrl);
    
    // Generate a unique filename
    const filename = generateImageFilename(theme, userId);
    
    // Save to storage (cloud or local based on environment)
    const useCloudStorage = process.env.NODE_ENV === 'production' && 
                           (process.env.AWS_S3_BUCKET || process.env.CLOUDINARY_CLOUD_NAME);
    
    if (useCloudStorage) {
      return await saveImageToCloud(imageBuffer, filename, userId);
    } else {
      return await saveImageLocally(imageBuffer, filename);
    }
  } catch (error) {
    console.error('Error storing generated image:', error);
    throw new Error('Failed to store generated image');
  }
}

/**
 * Cleanup function to delete temporary images (optional)
 */
export async function cleanupTempImages(filePaths: string[]): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  for (const filePath of filePaths) {
    try {
      const fullPath = path.join(process.cwd(), 'public', filePath);
      await fs.unlink(fullPath);
    } catch (error) {
      console.warn(`Failed to cleanup temp image: ${filePath}`, error);
    }
  }
}
