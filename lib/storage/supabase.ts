import { createClient } from '@supabase/supabase-js';

export async function uploadToSupabase(buffer: Buffer, mimeType: string, fileName: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_UPLOAD_BUCKET || 'uploads';

  if (!supabaseUrl || !serviceKey) throw new Error('Supabase storage not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Ensure bucket exists (ignore error if already exists)
  try {
    await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});
  } catch (e) {
    // ignore
  }

  const path = fileName;
  const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, { contentType: mimeType, upsert: false });
  if (error) {
    // If object exists and upsert=false, return a meaningful message
    throw new Error(error.message || 'Failed to upload to Supabase Storage');
  }

  // getPublicUrl returns an object with a `data` property that contains `publicUrl`
  const publicRes = await supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = (publicRes as any)?.data?.publicUrl;
  if (!publicUrl) throw new Error('Could not retrieve public URL from Supabase Storage');

  return { url: publicUrl, fileName };
}
