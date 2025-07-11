// app/api/messages/upload/route.js
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

// Get current user from JWT token
async function getCurrentUser(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// Safe file extension check
const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg', 
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  // Documents
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  // Archives (with size limits)
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_MESSAGE = 5;

export async function POST(request) {
  console.log('Upload API called');
  try {
    const currentUserId = await getCurrentUser(request);
    console.log('Current user ID:', currentUserId);
    
    if (!currentUserId) {
      console.log('No authorization');
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files');
    console.log('Received files:', files.length);
    
    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Dosya seçilmedi'
      }, { status: 400 });
    }

    if (files.length > MAX_FILES_PER_MESSAGE) {
      return NextResponse.json({
        success: false,
        message: `En fazla ${MAX_FILES_PER_MESSAGE} dosya yükleyebilirsiniz`
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'messages');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({
          success: false,
          message: `Dosya boyutu ${file.name} çok büyük (max: 10MB)`
        }, { status: 400 });
      }

      if (!ALLOWED_FILE_TYPES[file.type]) {
        return NextResponse.json({
          success: false,
          message: `Desteklenmeyen dosya türü: ${file.name}`
        }, { status: 400 });
      }

      // Generate safe filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = ALLOWED_FILE_TYPES[file.type];
      const safeFileName = `${timestamp}-${randomString}${extension}`;
      
      const filePath = path.join(uploadsDir, safeFileName);
      
      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Store file info
      uploadedFiles.push({
        originalName: file.name,
        fileName: safeFileName,
        filePath: `/uploads/messages/${safeFileName}`,
        fileSize: file.size,
        fileType: file.type,
        isImage: file.type.startsWith('image/'),
        uploadedAt: new Date()
      });
    }

    console.log('Upload completed, returning files:', uploadedFiles.length);
    return NextResponse.json({
      success: true,
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length
      },
      message: `${uploadedFiles.length} dosya başarıyla yüklendi`
    }, { status: 200 });

  } catch (error) {
    console.error('File Upload API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Dosya yükleme hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}