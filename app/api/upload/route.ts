import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Try common field name first, otherwise iterate to find any File
    let file = formData.get('file') as File | null;

    // If not provided as 'file', look through entries for a File
    if (!file) {
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          file = value as File;
          console.log('Found file under form field:', key, 'original name:', file.name, 'type:', file.type);
          break;
        }
      }
    }

    if (!file) {
      // Log available fields for debugging
      const keys = Array.from(formData.keys());
      console.warn('Upload received with no file. FormData keys:', keys);
      console.warn('Upload content-type:', request.headers.get('content-type'));
      return NextResponse.json({ error: 'No file provided', fields: keys }, { status: 400 });
    }

    // Log incoming file metadata for debugging mobile uploads
    console.log('Upload request - file name:', file.name, 'type:', file.type);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Basic validation: reject overly large files and non-image uploads
    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
    if (buffer.length > MAX_BYTES) {
      console.warn('Upload rejected: file too large', buffer.length);
      return NextResponse.json({ error: 'File too large. Max 10MB' }, { status: 413 });
    }

    const allowedImagePrefixes = ['image/'];
    const safeExts = new Set(['jpg','jpeg','png','gif','webp','svg','bmp','ico','jfif','heic','heif']);
    const hasImageMime = !!(file.type && allowedImagePrefixes.some(p => file.type.startsWith(p)));
    if (!hasImageMime) {
      const extCandidate = (file.name && file.name.includes('.')) ? (file.name.split('.').pop() || '').toLowerCase() : '';
      if (!safeExts.has(extCandidate)) {
        console.warn('Upload rejected: unsupported media type', file.type, extCandidate);
        return NextResponse.json({ error: 'Unsupported media type' }, { status: 415 });
      }
    }

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

    // Use pluggable storage backends (local by default, supabase, s3, etc.)
    try {
      // dynamic import of storage helper to keep code split
      const { uploadBuffer } = await import('@/lib/storage');
      const res = await uploadBuffer(buffer, file.type || undefined, fileName);
      console.log('Upload saved via backend, result:', res);
      return NextResponse.json({ url: res.url, fileName: res.fileName, type: file.type || null, success: true });
    } catch (e:any) {
      console.error('Upload error:', e);
      return NextResponse.json({ error: 'Failed to upload file', detail: e?.message || String(e) }, { status: 500 });
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file',
      detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
