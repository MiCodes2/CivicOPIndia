Supabase Storage Backend

This project supports a pluggable upload backend. For production on serverless platforms you can enable Supabase Storage by setting the environment variable `UPLOAD_BACKEND=supabase`.

Required environment variables for Supabase backend:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service Role Key (server-side only)
- `SUPABASE_UPLOAD_BUCKET` — (optional) bucket name to use (default: `uploads`)

Notes:
- The upload handler will upload files to the specified Supabase Storage bucket and return a public URL for each uploaded file.
- For development on your machine, keep `UPLOAD_BACKEND=local` (default) which writes to `public/uploads`.
- On serverless platforms (Vercel), local filesystem is read-only — ensure you set `UPLOAD_BACKEND=supabase` in your production environment.

Local migration tool:
- A helper script `scripts/migrate_uploads_to_supabase.js` can be used locally to re-upload any `public/uploads/*` files referenced in the `activities` table to Supabase Storage and update activity rows to point at the new public URLs.

Security:
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret and add it to the hosting provider's secrets (Vercel Environment Variables or similar).

If you'd like, I can add additional safety checks or a dry-run mode to the migration script.
