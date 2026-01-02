# CivicOp - Civic Intelligence & Operations Platform

> India's first GovTech Operations platform transforming urban governance through data-driven civic action.

## 🚀 Overview

CivicOp bridges the gap between **Citizen Grievance** and **Government Action**. We combine grassroots community pressure with high-tech monitoring tools to build transparent, efficient, data-driven city management.

### For Citizens
- Report, track, and verify civic infrastructure issues (potholes, garbage, etc.)
- Real-time status updates on reported issues
- Social engagement features (likes, shares, comments)

### For Governments
- Command Center for data visualization
- Ward analytics and heatmaps
- Workflow management and resource optimization

## 📦 Tech Stack

- **Framework:** Next.js 16 (App Router) with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel
- **AI/ML:** Computer Vision for issue verification

## 🔧 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account
- Google reCAPTCHA keys (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/MiCodes2/CivicOPIndia.git
cd CivicOPIndia

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
# Go to Supabase Dashboard → SQL Editor
# Run migrations from supabase/migrations/ in order

# Start development server
pnpm dev
```

Visit http://localhost:3000

### Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google reCAPTCHA (optional)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Upload Backend (supabase or local)
UPLOAD_BACKEND=supabase
```

## 📂 Project Structure

```
app/
├── page.tsx                 # Homepage (Hero, Stats, Roadmap)
├── about/                   # About page
├── activities/              # Activity feed
├── admin/                   # Admin dashboard
├── api/                     # API routes
├── citizens-issue/          # Issue reporting
├── contact/                 # Contact form
└── privacy-policy/          # Legal pages
components/
├── ActivityFeedCard.tsx     # Social media-style post card
├── ActivitiesClientList.tsx # Feed with filtering
├── Navbar.tsx               # Navigation
├── Footer.tsx               # Footer with CTA
├── admin/                   # Admin forms
└── ui/                      # shadcn components
lib/
├── supabase/               # Supabase client
├── types/                  # TypeScript types
├── formatContent.ts        # Content processing
└── utils.ts                # Utilities
supabase/
└── migrations/             # Database migrations
```

## 🎨 Key Features

### 1. Activity Feed
- Social media-style feed with engagement metrics
- Multiple image carousel support
- Video embeds (YouTube, X/Twitter, Google Drive)
- Real-time updates
- Hashtag linking and search

### 2. Admin Panel (`/admin/login`)
- WYSIWYG content editor
- Multi-image upload with preview
- Activity type management
- Pin and highlight posts (X/Twitter style)
- Draft auto-save

### 3. Pinned & Highlighted Posts
- **Pin to Top (📌):** Only ONE post can be pinned at a time (auto-unpins others)
- **Highlight (⭐):** Multiple posts can be highlighted, sorted by `highlighted_at` (most recent first)
- Display order: Pinned post → Highlighted posts → Regular posts

Database columns:
```sql
is_pinned BOOLEAN DEFAULT FALSE
is_highlighted BOOLEAN DEFAULT FALSE
pinned_at TIMESTAMPTZ
highlighted_at TIMESTAMPTZ
```

### 4. Content Processing
- HTML entity decoding
- Automatic embed detection (YouTube, Twitter, Drive)
- Image optimization
- Hashtag linkification
- XSS protection

### 5. Upload Backend (Pluggable)
Two modes supported via `UPLOAD_BACKEND` env variable:

**Local Mode (`UPLOAD_BACKEND=local`):**
- Files stored in `/public/uploads/`
- Works for development only

**Supabase Mode (`UPLOAD_BACKEND=supabase`):**
- Files stored in Supabase Storage buckets
- Required for production on Vercel
- Requires `SUPABASE_SERVICE_ROLE_KEY`

## 🗄️ Database Schema

Key tables in Supabase:

### `activities`
```sql
id SERIAL PRIMARY KEY
title TEXT
content TEXT
location TEXT
type TEXT (Meeting, Protest, Campaign, etc.)
activity_date TIMESTAMPTZ
image_url TEXT (legacy single image)
image_urls TEXT[] (multiple images)
video_url TEXT
likes_count INTEGER
shares_count INTEGER
views_count INTEGER
author_id UUID
author_name TEXT
tags TEXT[]
is_pinned BOOLEAN
is_highlighted BOOLEAN
pinned_at TIMESTAMPTZ
highlighted_at TIMESTAMPTZ
```

### `activity_likes`
```sql
user_id UUID
activity_id INTEGER
```

### `social_metrics`
Aggregated social media follower counts

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
```

### Environment Variables for Production
- Set all variables from `.env.local`
- **Critical:** Set `UPLOAD_BACKEND=supabase` for production
- Add `SUPABASE_SERVICE_ROLE_KEY` for admin operations

## 📱 API Routes

### Public
- `GET /api/activities` - Fetch activities
- `POST /api/activities/like` - Toggle like
- `POST /api/activities/share` - Increment share count
- `POST /api/activities/seed` - Seed synthetic metrics

### Admin (Protected)
- `POST /api/admin/create-activity` - Create new activity
- `POST /api/admin/update-activity` - Update activity
- `POST /api/admin/upload` - Upload images
- `GET /api/admin/activity-types` - Get activity types

## 🎯 Roadmap

### Phase 1: LIVE PILOT ✅
- [x] Activity feed with social features
- [x] Admin dashboard
- [x] Multi-image support
- [x] Pinned/highlighted posts

### Phase 2: BETA 🚧
- [ ] AI-powered issue verification
- [ ] Mobile app (React Native)
- [ ] Ward-level analytics

### Phase 3: AVAILABLE
- [ ] Government command center
- [ ] Real-time heatmaps
- [ ] Workflow automation
- [ ] API for municipal integration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by Civic Opposition of India.

## 🔗 Links

- **Website:** https://civicopindia.com
- **Platform:** https://app.civicopindia.com
- **Twitter/X:** https://x.com/CivicOp_india
- **Email:** citizens.east.blr@gmail.com

## 🙏 Acknowledgments

Built with passion for transparency, efficiency, and data-driven urban governance.

**From grassroots activism to India's first GovTech Operations platform.**

---

*Transforming urban governance through data-driven civic action and intelligent operations.*
