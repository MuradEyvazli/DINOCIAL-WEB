// lib/services/cloudinary.js - Professional Image Service
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class ImageService {
  constructor() {
    this.cloudinary = cloudinary;
  }

  // Upload avatar with professional processing
  async uploadAvatar(file, userId) {
    try {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataURI = `data:${file.type};base64,${base64}`;

      // Upload original
      const originalUpload = await this.cloudinary.uploader.upload(dataURI, {
        folder: `rpg-social/avatars/${userId}`,
        public_id: `avatar-original-${Date.now()}`,
        resource_type: 'image',
        overwrite: true,
        invalidate: true,
        quality: 'auto:best',
        format: 'auto'
      });

      // Create processed version (standardized size)
      const processedUpload = await this.cloudinary.uploader.upload(dataURI, {
        folder: `rpg-social/avatars/${userId}`,
        public_id: `avatar-processed-${Date.now()}`,
        resource_type: 'image',
        overwrite: true,
        invalidate: true,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good' },
          { format: 'auto' },
          { effect: 'sharpen:100' },
          { background: 'auto' }
        ]
      });

      // Create thumbnail
      const thumbnailUpload = await this.cloudinary.uploader.upload(dataURI, {
        folder: `rpg-social/avatars/${userId}`,
        public_id: `avatar-thumb-${Date.now()}`,
        resource_type: 'image',
        overwrite: true,
        invalidate: true,
        transformation: [
          { width: 100, height: 100, crop: 'fill', gravity: 'face' },
          { quality: 'auto:low' },
          { format: 'auto' }
        ]
      });

      return {
        original: originalUpload,
        processed: processedUpload,
        thumbnail: thumbnailUpload
      };

    } catch (error) {
      console.error('Avatar upload error:', error);
      throw new Error(`Avatar upload failed: ${error.message}`);
    }
  }

  // Upload post image
  async uploadPostImage(file, userId) {
    try {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataURI = `data:${file.type};base64,${base64}`;

      const uploadResult = await this.cloudinary.uploader.upload(dataURI, {
        folder: `rpg-social/posts/${userId}`,
        public_id: `post-${Date.now()}`,
        resource_type: 'image',
        overwrite: true,
        invalidate: true,
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto:good' },
          { format: 'auto' }
        ]
      });

      return uploadResult;

    } catch (error) {
      console.error('Post image upload error:', error);
      throw new Error(`Post image upload failed: ${error.message}`);
    }
  }

  // Delete image by public ID
  async deleteImage(publicId) {
    try {
      const result = await this.cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Image deletion error:', error);
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }

  // Delete avatar (all versions)
  async deleteAvatar(publicIds) {
    try {
      const promises = [];
      if (publicIds.original) promises.push(this.deleteImage(publicIds.original));
      if (publicIds.processed) promises.push(this.deleteImage(publicIds.processed));
      if (publicIds.thumbnail) promises.push(this.deleteImage(publicIds.thumbnail));
      
      const results = await Promise.allSettled(promises);
      return results;
    } catch (error) {
      console.error('Avatar deletion error:', error);
      throw new Error(`Avatar deletion failed: ${error.message}`);
    }
  }

  // Get optimized image URL
  getOptimizedUrl(publicId, options = {}) {
    const {
      width = 'auto',
      height = 'auto',
      crop = 'scale',
      quality = 'auto:good',
      format = 'auto'
    } = options;

    return this.cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      format,
      secure: true
    });
  }

  // Generate responsive image URLs
  getResponsiveUrls(publicId) {
    const breakpoints = [320, 640, 768, 1024, 1280, 1536];
    
    return breakpoints.map(width => ({
      width,
      url: this.getOptimizedUrl(publicId, { width })
    }));
  }

  // Health check
  async healthCheck() {
    try {
      const result = await this.cloudinary.api.ping();
      return { status: 'healthy', result };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

// Export singleton instance
export default new ImageService();