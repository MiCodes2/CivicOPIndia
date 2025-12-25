import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

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
        // Some MIME subtypes like 'jpeg' should be normalized to 'jpg'
        if (fileExt === 'jpeg') fileExt = 'jpg';
        if (fileExt === 'pjpeg') fileExt = 'jpg';
        if (fileExt === 'jfif') fileExt = 'jpg';
      }
    }

    // As a last resort, default to jpg to ensure browsers can render the asset
    if (!fileExt) fileExt = 'jpg';

    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);

    // Write file to public/uploads
    await writeFile(filePath, buffer);

    // Return the public URL
    return NextResponse.json({ 
      url: `/uploads/${fileName}`,
      success: true 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 });
  }
}
