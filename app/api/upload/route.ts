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
    let fileExt = (file.name.split('.').pop() || '').toLowerCase();
    // Normalize JFIF to a common JPEG extension so browsers and image handlers treat it correctly
    if (fileExt === 'jfif') fileExt = 'jpg';
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
