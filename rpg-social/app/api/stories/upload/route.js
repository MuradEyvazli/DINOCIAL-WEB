// app/api/stories/upload/route.js
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { 
  getAuthenticatedUser, 
  handleApiError, 
  successResponse,
  rateLimitMiddleware,
  ERROR_TYPES,
  ApiError
} from '@/lib/middleware/auth';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST - Upload story media
export async function POST(request) {
  try {
    // Rate limiting - 10 uploads per minute
    const rateLimit = rateLimitMiddleware(10, 60 * 1000);
    rateLimit(request);
    
    // Authentication
    const user = await getAuthenticatedUser(request);
    
    console.log('📸 Story media upload başlatıldı - User:', user.username);
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      throw new ApiError('Dosya gerekli', ERROR_TYPES.VALIDATION_ERROR);
    }
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    const isImage = validImageTypes.includes(file.type);
    const isVideo = validVideoTypes.includes(file.type);
    
    if (!isImage && !isVideo) {
      throw new ApiError('Geçersiz dosya tipi', ERROR_TYPES.VALIDATION_ERROR);
    }
    
    // Validate file size
    const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024; // 10MB for images, 50MB for videos
    if (file.size > maxSize) {
      throw new ApiError(
        `Dosya boyutu çok büyük. Maksimum: ${isImage ? '10MB' : '50MB'}`,
        ERROR_TYPES.VALIDATION_ERROR
      );
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `stories/${user._id}`,
          resource_type: isVideo ? 'video' : 'image',
          transformation: isImage ? [
            { width: 1080, height: 1920, crop: 'limit' },
            { quality: 'auto:good' }
          ] : [
            { width: 1080, height: 1920, crop: 'limit' },
            { quality: 'auto:good', video_codec: 'auto' }
          ],
          format: isImage ? 'jpg' : 'mp4'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      uploadStream.end(buffer);
    });
    
    const result = await uploadPromise;
    
    console.log('✅ Story media uploaded successfully:', result.public_id);
    
    return successResponse({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type
    });
    
  } catch (error) {
    console.error('Story upload error:', error);
    return handleApiError(error);
  }
}

// DELETE - Delete uploaded media (cleanup)
export async function DELETE(request) {
  try {
    // Authentication
    const user = await getAuthenticatedUser(request);
    
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');
    const resourceType = searchParams.get('resourceType') || 'image';
    
    if (!publicId) {
      throw new ApiError('Public ID gerekli', ERROR_TYPES.VALIDATION_ERROR);
    }
    
    // Verify the public ID belongs to the user
    if (!publicId.includes(`stories/${user._id}`)) {
      throw new ApiError('Bu medyayı silme yetkiniz yok', ERROR_TYPES.FORBIDDEN);
    }
    
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    console.log('🗑️ Story media deleted:', publicId);
    
    return successResponse({
      message: 'Medya başarıyla silindi'
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}