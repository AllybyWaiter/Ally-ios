/**
 * Compresses an image file to reduce size while maintaining quality
 * @param file - The image file to compress
 * @param maxSizeMB - Maximum size in megabytes (default: 1MB)
 * @param maxWidthOrHeight - Maximum width or height in pixels (default: 1920px)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 1,
  maxWidthOrHeight: number = 1920,
  quality: number = 0.8
): Promise<File> {
  // Validate and clamp quality to valid range (0.1 to 1.0)
  const validQuality = Math.max(0.1, Math.min(1, quality));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
            if (width > height) {
              height = (height / width) * maxWidthOrHeight;
              width = maxWidthOrHeight;
            } else {
              width = (width / height) * maxWidthOrHeight;
              height = maxWidthOrHeight;
            }
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Use better image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }

              // Check if we need further compression
              const targetSizeBytes = maxSizeMB * 1024 * 1024;
              
              if (blob.size <= targetSizeBytes) {
                // Size is acceptable, create file
                const compressedFile = new File(
                  [blob],
                  file.name,
                  { type: 'image/jpeg' }
                );
                resolve(compressedFile);
              } else {
                // Need more compression, reduce quality iteratively
                const attemptCompression = (quality: number, attempt: number) => {
                  canvas.toBlob(
                    (compressedBlob) => {
                      if (!compressedBlob) {
                        reject(new Error(`Failed to create blob on attempt ${attempt}`));
                        return;
                      }

                      if (compressedBlob.size <= targetSizeBytes || quality <= 0.3) {
                        // Accept the result — either within target or at minimum quality
                        const compressedFile = new File(
                          [compressedBlob],
                          file.name,
                          { type: 'image/jpeg' }
                        );
                        resolve(compressedFile);
                      } else {
                        // Try again with lower quality
                        attemptCompression(Math.max(0.3, quality * 0.7), attempt + 1);
                      }
                    },
                    'image/jpeg',
                    quality
                  );
                };

                attemptCompression(Math.max(0.5, validQuality * 0.8), 2);
              }
            },
            'image/jpeg',
            validQuality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Gets formatted file size string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0 || !Number.isFinite(bytes)) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // Clamp index to valid range and handle edge cases
  const clampedIndex = Math.min(Math.max(0, i), sizes.length - 1);
  
  return `${parseFloat((bytes / Math.pow(k, clampedIndex)).toFixed(2))} ${sizes[clampedIndex]}`;
}

/**
 * Validates if file is an image
 * @param file - File to validate
 * @returns True if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Validates image file and provides helpful error messages
 * @param file - File to validate
 * @param maxSizeMB - Maximum allowed size in MB
 * @returns Object with isValid and error message
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { isValid: boolean; error?: string } {
  if (!isImageFile(file)) {
    return {
      isValid: false,
      error: 'Please select an image file (JPEG, PNG, WebP, etc.)',
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `Image must be smaller than ${maxSizeMB}MB. Current size: ${formatFileSize(file.size)}`,
    };
  }

  return { isValid: true };
}
