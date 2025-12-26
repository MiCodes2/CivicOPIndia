import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Log incoming file metadata for debugging mobile uploads
    console.log('Upload request - file name:', file.name, 'type:', file.type);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Create unique filename
    // Determine a safe file extension. Prefer the name-based extension when present; otherwise derive
    // from the file's MIME type. This fixes mobile uploads where the filename may lack an extension.
    let fileExt = '';

    // If file.name contains a dot and an extension, use it
    if (file.name && file.name.includes('.')) {
      fileExt = (file.name.split('.').pop() || '').toLowerCase();
    }

    // Fallback: infer from MIME type (e.g., image/jpeg -> jpg)
    if (!fileExt && file.type) {
      const mimeParts = file.type.split('/');
      if (mimeParts.length === 2) {
        fileExt = mimeParts[1].toLowerCase();
        // Normalize common types
        if (fileExt === 'jpeg') fileExt = 'jpg';
        if (fileExt === 'pjpeg') fileExt = 'jpg';
        if (fileExt === 'jfif') fileExt = 'jpg';
        // Mobile formats that may appear on iOS/Android
        if (fileExt === 'heic' || fileExt === 'x-heic' || fileExt === 'heif' || fileExt === 'x-heif') fileExt = 'jpg';
      }
    }

    // As a last resort, default to jpg to ensure browsers can render the asset
    if (!fileExt) fileExt = 'jpg';

    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);

    // Write file to public/uploads
    await writeFile(filePath, buffer);

    console.log('Upload saved to:', filePath);

    // Return the public URL and metadata for debugging
    return NextResponse.json({ 
      url: `/uploads/${fileName}`,
      fileName,
      type: file.type || null,
      success: true 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file',
      detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
