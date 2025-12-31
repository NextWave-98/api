import { Business } from '../../models';
import { AppError } from '../../shared/utils/app-error';
import { UpdateBusinessDto } from './business.dto';
import { uploadToCloudinary, deleteFromCloudinary } from '../../shared/utils/cloudinary';

export class BusinessService {
  /**
   * Get business profile
   * Returns the first (and only) business record
   */
  async getBusinessProfile() {
    let business = await Business.findOne();

    // If no business record exists, create a default one
    if (!business) {
      business = await Business.create({
        name: 'My Business',
      });
    }

    return business.toJSON();
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(data: UpdateBusinessDto, logoFile?: Express.Multer.File) {
    let business = await Business.findOne();

    // Upload logo to Cloudinary if provided
    let logoPath: string | undefined;
    if (logoFile) {
      try {
        // Get original filename without extension
        const originalName = logoFile.originalname.split('.')[0];

        // Upload with custom options to preserve filename
        const uploadResult = await this.uploadLogoToCloudinary(logoFile, originalName);

        // Extract relative path from the secure URL
        // Example: https://res.cloudinary.com/droluky92/image/upload/v1766231611/business/logos/filename.png
        // Becomes: /image/upload/v1766231611/business/logos/filename.png
        const url = new URL(uploadResult.secureUrl);
        logoPath = url.pathname;

        // Delete old logo from Cloudinary if exists
        if (business && business.logo) {
          try {
            // Extract public ID from the old logo path
            // Example: /image/upload/v1766231611/business/logos/filename.png
            // Extract: business/logos/filename
            const pathParts = business.logo.split('/');
            const uploadIndex = pathParts.indexOf('upload');
            if (uploadIndex !== -1 && uploadIndex + 2 < pathParts.length) {
              const publicIdWithExtension = pathParts.slice(uploadIndex + 2).join('/');
              const publicId = publicIdWithExtension.split('.')[0];
              await deleteFromCloudinary(publicId, 'image');
            }
          } catch (error) {
            console.error('Failed to delete old logo:', error);
            // Continue even if deletion fails
          }
        }
      } catch (error: any) {
        throw new AppError(500, `Failed to upload logo: ${error.message}`);
      }
    }

    // Prepare update data
    const updateData = {
      ...data,
      ...(logoPath && { logo: logoPath }),
    };

    // If no business record exists, create one
    if (!business) {
      business = await Business.create({
        name: data.name || 'My Business',
        ...updateData,
      });
    } else {
      // Update existing record
      await business.update(updateData);
    }

    return business.toJSON();
  }

  /**
   * Upload logo to Cloudinary with original filename
   */
  private async uploadLogoToCloudinary(file: Express.Multer.File, filename: string) {
    const { default: cloudinary } = await import('../../shared/utils/cloudinary');

    return new Promise<{ url: string; publicId: string; secureUrl: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'business/logos',
          resource_type: 'image',
          public_id: filename,
          use_filename: true,
          unique_filename: false,
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.url,
              publicId: result.public_id,
              secureUrl: result.secure_url,
            });
          } else {
            reject(new Error('Upload failed'));
          }
        }
      );
      uploadStream.end(file.buffer);
    });
  }
}
