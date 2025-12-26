// Google Drive backend removed; use Supabase or S3 backends instead.
export async function uploadToGoogleDrive() {
  throw new Error('Google Drive backend has been removed. Use UPLOAD_BACKEND=supabase or s3 and the corresponding adapter.');
}
