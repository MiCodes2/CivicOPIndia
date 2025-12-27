# Civic Opposition of India

Official website for Civic Opposition of India - Building a transparent, accountable democracy through collective civic action.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## 🔧 Setup

### 1. Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

### 2. Database Setup
Run the migration in your Supabase SQL Editor:
```bash
supabase/migrations/001_activities_schema.sql
```

### 3. Create Admin User
- Go to Supabase → Authentication → Users
- Create new user with email/password

## 📱 Features

- **Home**: About us, team, statistics
- **Activities**: Social feed with like/share functionality
- **Donate**: Transparent donation page
- **Admin Panel**: Post activities at `/admin/login`

## 🛠 Tech Stack

Next.js 16, TypeScript, Tailwind CSS, Supabase, Shadcn UI

## 📞 Contact

- Twitter/X: https://x.com/CivicOp_india
- Members: 34,100+

## 📞 Contact

- Twitter/X: https://x.com/CivicOp_india
- Members: 34,100+

---

### Fixes
- Mobile image uploads: infer missing file extensions from MIME types and allow re-uploading images when editing an activity. This resolves issues where images selected from some mobile devices did not display correctly in posts.

Uploads backend: This project supports pluggable upload backends. For production on serverless platforms (e.g., Vercel) you should set `UPLOAD_BACKEND=supabase` (or S3 if you prefer). See `docs/UPLOAD_BACKEND.md` for details and required environment variables.

After switching to the Supabase backend, ensure `SUPABASE_SERVICE_ROLE_KEY` is present in your deployment environment and set `UPLOAD_BACKEND=supabase`.

Built with ❤️ for transparency and accountability
