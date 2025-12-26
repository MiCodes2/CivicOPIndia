import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { uploadToSupabase } from './supabase';

export interface UploadResult { url: string; fileName: string; type?: string; }

export async function uploadBuffer(buffer: Buffer, mimeType: string | undefined, fileName: string): Promise<UploadResult> {
  const backend = (process.env.UPLOAD_BACKEND || 'local').toLowerCase();

  if (backend === 'supabase') {
    return await uploadToSupabase(buffer, mimeType || 'application/octet-stream', fileName);
  }

  // local fallback: write to public/uploads (useful for local development)
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, fileName);
  await writeFile(filePath, buffer);
  return { url: `/uploads/${fileName}`, fileName };
}
