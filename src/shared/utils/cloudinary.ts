import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env';
import { AppError } from './app-error';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
}

/**
 * Upload a file to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Folder path in Cloudinary (optional)
 * @param resourceType - Type of resource (image, video, raw, auto)
 * @returns Upload result with URL and public ID
 */
export const uploadToCloudinary = async (
  file: Express.Multer.File | Buffer | string,
  folder: string = 'customers/documents',
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<UploadResult> => {
  try {
    let uploadOptions: any = {
      folder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };

    let uploadResult;

    if (Buffer.isBuffer(file)) {
      // Upload from buffer
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file);
      });
    } else if (typeof file === 'string') {
      // Upload from base64 string
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    } else {
      // Upload from multer file
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
    }

    if (!uploadResult) {
      throw new AppError(500, 'Failed to upload file to Cloudinary');
    }

    return {
      url: (uploadResult as any).url,
      publicId: (uploadResult as any).public_id,
      secureUrl: (uploadResult as any).secure_url,
    };
  } catch (error: any) {
    throw new AppError(500, `Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param files - Array of files
 * @param folder - Folder path in Cloudinary (optional)
 * @returns Array of upload results
 */
export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder: string = 'customers/documents'
): Promise<UploadResult[]> => {
  try {
    const uploadPromises = files.map((file) => uploadToCloudinary(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error: any) {
    throw new AppError(500, `Failed to upload files: ${error.message}`);
  }
};

/**
 * Delete a file from Cloudinary
 * @param publicId - Public ID of the file to delete
 * @param resourceType - Type of resource (image, video, raw)
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error: any) {
    throw new AppError(500, `Failed to delete file from Cloudinary: ${error.message}`);
  }
};

export default cloudinary;


