import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../utils/app-error';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param fileBuffer - Buffer of the image file
 * @param folder - Folder name in Cloudinary (e.g., 'staff')
 * @param publicId - Optional custom public ID
 * @returns Cloudinary upload result with secure_url and public_id
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = 'staff',
  publicId?: string
): Promise<{ url: string; publicId: string }> => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `lts/${folder}`,
          public_id: publicId,
          resource_type: 'auto',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(new AppError(500, `Failed to upload image: ${error.message}`));
          }
          if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error: any) {
    throw new AppError(500, `Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Deletion result
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    if (!publicId) {
      return;
    }

    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    // Log error but don't throw - deletion failure shouldn't break the flow
    console.error(`Failed to delete image from Cloudinary: ${error.message}`);
  }
};

/**
 * Update image in Cloudinary (delete old and upload new)
 * @param fileBuffer - Buffer of the new image file
 * @param oldPublicId - Public ID of the old image to delete
 * @param folder - Folder name in Cloudinary
 * @returns New image details
 */
export const updateImageInCloudinary = async (
  fileBuffer: Buffer,
  oldPublicId: string | null,
  folder: string = 'staff'
): Promise<{ url: string; publicId: string }> => {
  try {
    // Delete old image if exists
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    // Upload new image
    return await uploadToCloudinary(fileBuffer, folder);
  } catch (error: any) {
    throw new AppError(500, `Failed to update image: ${error.message}`);
  }
};

export default cloudinary;

