# Quick Reference Guide

## 🎯 Common Tasks

### Adding a New Page

```bash
# Create a new route folder
mkdir -p app/about

# Create the page
touch app/about/page.tsx
```

Example page structure:
```tsx
export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold">About Us</h1>
      {/* Your content */}
    </div>
  );
}
```

### Adding More Shadcn Components

```bash
# See available components
npx shadcn@latest add

# Add specific component
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add table
```

### Fetching Data from Supabase

**Server Component (Recommended for initial page load):**
```tsx
import { createClient } from "@/lib/supabase/server";

export default async function MyPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('activities').select('*');
  
  return <div>{/* Render data */}</div>;
}
```

**Client Component (For interactive features):**
```tsx
"use client";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function MyComponent() {
  const [data, setData] = useState([]);
  const supabase = createClient();
  
  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('activities').select('*');
      setData(data || []);
    }
    fetchData();
  }, []);
  
  return <div>{/* Render data */}</div>;
}
```

### Database Operations

**Insert:**
```tsx
const { data, error } = await supabase
  .from('activities')
  .insert([
    { title: 'Protest March', content: 'Details...', location: 'Delhi' }
  ]);
```

**Update:**
```tsx
const { data, error } = await supabase
  .from('activities')
  .update({ title: 'Updated Title' })
  .eq('id', 123);
```

**Delete:**
```tsx
const { error } = await supabase
  .from('activities')
  .delete()
  .eq('id', 123);
```

### Authentication

Enable in Supabase Dashboard: Authentication → Providers

**Sign Up:**
```tsx
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});
```

**Sign In:**
```tsx
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

**Sign Out:**
```tsx
const { error } = await supabase.auth.signOut();
```

**Get Current User:**
```tsx
const { data: { user } } = await supabase.auth.getUser();
```

### File Upload (Supabase Storage)

**Create a storage bucket first in Supabase Dashboard**

```tsx
const file = event.target.files[0];

const { data, error } = await supabase.storage
  .from('documents')
  .upload(`public/${file.name}`, file);

// Get public URL
const { data: urlData } = supabase.storage
  .from('documents')
  .getPublicUrl(`public/${file.name}`);
```

### Environment Variables

**Add to .env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

**Access in code:**
```tsx
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

Note: Variables starting with `NEXT_PUBLIC_` are exposed to the browser.

### Protecting Admin Routes

**Create middleware.ts in root:**
```tsx
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*']
}
```

### Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables
```

### Common Lucide Icons

```tsx
import { 
  Home, Activity, Heart, Menu, X,
  MapPin, Calendar, Users, Archive,
  Mail, Phone, Globe, Share2,
  ChevronRight, ArrowRight, Check
} from "lucide-react";

<Home className="h-4 w-4" />
```

### Tailwind CSS Classes (Most Used)

**Layout:**
- `container mx-auto px-4` - Centered container
- `flex items-center justify-between` - Flexbox
- `grid grid-cols-3 gap-4` - Grid layout

**Spacing:**
- `mt-4` (margin-top), `p-4` (padding)
- `space-y-4` (vertical spacing between children)

**Typography:**
- `text-4xl font-bold` - Large heading
- `text-sm text-muted-foreground` - Small secondary text

**Colors:**
- `bg-primary text-primary-foreground` - Primary button
- `text-muted-foreground` - Secondary text
- `border` - Border with theme color

### Debugging Tips

**Check Supabase connection:**
```bash
# In browser console
const { data, error } = await window._supabaseClient.from('activities').select('*')
console.log(data, error)
```

**View build errors:**
```bash
npm run build
```

**Check TypeScript errors:**
```bash
npx tsc --noEmit
```

**View server logs:**
Development server shows logs in terminal where `npm run dev` is running.

---

Need more help? Check the [README.md](README.md) or official docs!