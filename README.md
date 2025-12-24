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
```

### 2. Database Setup
Run the migrations in your Supabase SQL Editor (see `supabase/migrations/`):
```bash
supabase/migrations/001_activities_schema.sql
supabase/migrations/002_add_author_name.sql
supabase/migrations/003_activity_likes.sql
supabase/migrations/004_create_activity_types.sql
supabase/migrations/005_add_full_text_search.sql
```

### Search (Supabase full-text)
This project uses **Supabase Postgres full-text search** for site-wide search (no extra hosting required).

To enable search features locally or in production:

1. Apply the migration `005_add_full_text_search.sql` using the Supabase SQL editor or the Supabase CLI.
2. (Optional) Reindex or review existing rows — the `search_vector` is a generated column and will be available immediately after migration.

Helper functions are provided in the migration:
- `search_activities(query, type, tag, limit, offset)` — paginated search
- `search_activities_count(query, type, tag)` — total count
- `suggest_activities(prefix, limit)` — autocomplete suggestions

The app exposes `/api/search` and `/api/search/suggest` which power the frontend UI.


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

Built with ❤️ for transparency and accountability
