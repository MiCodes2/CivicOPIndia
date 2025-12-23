# Deployment Checklist 🚀

Use this checklist before deploying to production.

## Pre-Deployment

### Database Setup
- [ ] Supabase project created
- [ ] All database tables created (profiles, activities, archives, campaigns, signatures, donations)
- [ ] Row Level Security (RLS) policies enabled on all tables
- [ ] Storage buckets created (if using file uploads)
- [ ] Test data added for verification

### Security
- [ ] Environment variables configured in `.env.local`
- [ ] `.env.local` is in `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] RLS policies tested for all tables
- [ ] CORS settings configured in Supabase (if needed)

### Content
- [ ] Home page content updated
- [ ] About page created with team info
- [ ] Contact information added
- [ ] Privacy policy added (required for donations)
- [ ] Terms of service added

### Testing
- [ ] All pages load without errors
- [ ] Navigation works on mobile and desktop
- [ ] Forms validate properly
- [ ] Database queries return expected data
- [ ] Images load correctly
- [ ] No console errors in browser

### Performance
- [ ] Images optimized (use Next.js Image component)
- [ ] Unnecessary dependencies removed
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`

## Vercel Deployment

### Setup
- [ ] Vercel account created
- [ ] GitHub repository created and pushed
- [ ] Vercel project connected to repository

### Configuration
- [ ] Environment variables added in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - (Add others as needed)
- [ ] Production domain configured
- [ ] Custom domain added (if applicable)

### Deploy
```bash
# Via Vercel CLI
vercel --prod

# Or via GitHub
git push origin main
# Vercel will auto-deploy
```

### Post-Deployment Verification
- [ ] Production site loads
- [ ] All pages accessible
- [ ] Database connection works
- [ ] Forms submit successfully
- [ ] Mobile responsive
- [ ] SEO meta tags present (check with view-source)

## Optional Integrations

### Payment Gateway (Razorpay)
- [ ] Razorpay account created
- [ ] API keys obtained
- [ ] Test mode verified
- [ ] Webhook endpoint configured
- [ ] Production keys added to Vercel env vars

### Email Service
- [ ] Email provider chosen (Resend/SendGrid)
- [ ] API key obtained
- [ ] Email templates created
- [ ] Test emails sent successfully

### Analytics
- [ ] Vercel Analytics enabled (free)
- [ ] Google Analytics added (optional)
- [ ] Plausible/Fathom added (privacy-focused alternative)

### Monitoring
- [ ] Vercel error tracking enabled
- [ ] Sentry configured (optional)
- [ ] Uptime monitoring setup (UptimeRobot, etc.)

## SEO & Social

### Meta Tags
- [ ] Title and description on all pages
- [ ] Open Graph tags for social sharing
- [ ] Twitter Card meta tags
- [ ] Favicon added

### Social
- [ ] Share buttons functional
- [ ] WhatsApp share configured for India
- [ ] Social media accounts linked

### Sitemap & SEO
```bash
# Generate sitemap (in app/sitemap.ts)
export default function sitemap() {
  return [
    { url: 'https://civicopposition.org', lastModified: new Date() },
    { url: 'https://civicopposition.org/activities', lastModified: new Date() },
    // Add all pages
  ]
}
```

## Maintenance

### Regular Tasks
- [ ] Database backups enabled in Supabase
- [ ] Monitor Vercel usage/limits
- [ ] Update dependencies monthly: `npm update`
- [ ] Review error logs weekly
- [ ] Security updates applied promptly

### Content Updates
- [ ] Process for adding new activities
- [ ] Process for adding new documents
- [ ] Process for user management
- [ ] Backup strategy for admin passwords

## Legal & Compliance

### Required Pages (India)
- [ ] Privacy Policy (especially for donations)
- [ ] Terms of Service
- [ ] Refund Policy (for donations)
- [ ] Contact Information (physical address for NGO)
- [ ] FCRA compliance notice (if accepting foreign donations)

### Accessibility
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG standards
- [ ] Screen reader tested

## Emergency Contacts

**Developer:**
- Name: _________________
- Email: _________________
- Phone: _________________

**Vercel Account:**
- Email: _________________
- 2FA: Enabled/Disabled

**Supabase Account:**
- Email: _________________
- Project ID: _________________

**Domain Registrar:**
- Provider: _________________
- Login: _________________

---

## Post-Launch

- [ ] Announce launch on social media
- [ ] Notify existing members via email
- [ ] Submit to Google Search Console
- [ ] Share with local press/media
- [ ] Create launch blog post
- [ ] Gather user feedback
- [ ] Plan iteration cycle

**Deployment Date:** __________  
**Deployed By:** __________  
**Version:** 1.0.0