# Pinned and Highlighted Posts Feature

This feature allows administrators to pin important posts to the top of the activities feed and highlight posts with special visual styling, similar to X/Twitter's pinned posts.

## Features

### 1. **Pin to Top** 📌
- Pin posts to the top of the activities feed
- Pinned posts appear before all other posts
- Multiple posts can be pinned (sorted by pinned_at timestamp)
- Pinned indicator shows at the top of the card

### 2. **Highlight Post** ⭐
- Add special visual styling to draw attention to important posts
- Highlighted posts display with:
  - Amber/gold border (2px)
  - Shadow effect with amber glow
  - Ring styling for prominence
- Can be combined with pinning for maximum visibility

## Database Schema

New columns added to `activities` table:

```sql
is_pinned         BOOLEAN DEFAULT FALSE
is_highlighted    BOOLEAN DEFAULT FALSE  
pinned_at         TIMESTAMPTZ           -- Auto-set when pinned
```

## Usage

### Admin Panel

1. Navigate to `/admin/dashboard`
2. Create or edit an activity
3. Scroll to "Post Display Options" section
4. Toggle options:
   - **📌 Pin to Top**: Pin this post to the top of the feed
   - **⭐ Highlight Post**: Display with special styling

### Display Behavior

**Pinned Posts:**
- Always appear at the top of the activities feed
- Show "📌 Pinned Post" indicator
- Sorted by `pinned_at` desc among other pinned posts

**Highlighted Posts:**
- Display with amber/gold border and glow effect
- Stand out visually in the feed
- Can be pinned or unpinned

**Combined (Pinned + Highlighted):**
- Post appears at top WITH special styling
- Maximum visibility for critical announcements

## Implementation Details

### Frontend Components

**EditActivityForm.tsx:**
- Added checkboxes for is_pinned and is_highlighted
- Updated formData state to include new fields

**NewActivityForm.tsx:**
- Added same toggles for creating new activities
- Included in draft saving/loading

**ActivityFeedCard.tsx:**
- Added pinned indicator banner
- Conditional border/shadow styling for highlights
- Visual distinction for important posts

**ActivitiesClientList.tsx:**
- Modified sort logic to prioritize pinned posts
- Sorts by: is_pinned DESC, pinned_at DESC, activity_date DESC

### Backend API

**update-activity/route.ts:**
- Added is_pinned, is_highlighted to allowed fields
- Auto-sets pinned_at timestamp when pinning
- Clears pinned_at when unpinning

### Database Migration

**019_add_pinned_highlight.sql:**
- Adds new columns with appropriate defaults
- Creates indexes for query optimization
- Includes comments for documentation

## Running the Migration

```bash
node scripts/add_pinned_highlight.js
```

This will:
1. Add the new columns to the activities table
2. Create performance indexes
3. Display success confirmation

## Use Cases

1. **Announcements**: Pin important organizational updates
2. **Events**: Highlight upcoming critical events
3. **Campaigns**: Feature active campaigns prominently
4. **Urgent Issues**: Draw attention to time-sensitive civic matters
5. **Milestones**: Celebrate achievements with highlighted posts

## Visual Examples

### Pinned Post
```
┌─────────────────────────────────────┐
│ 📌 Pinned Post                      │
├─────────────────────────────────────┤
│ [Post Content]                      │
└─────────────────────────────────────┘
```

### Highlighted Post
```
╔═════════════════════════════════════╗ <- Amber border + glow
║ [Post Content]                      ║
╚═════════════════════════════════════╝
```

### Pinned + Highlighted
```
╔═════════════════════════════════════╗ <- Amber border + glow
║ 📌 Pinned Post                      ║
╠═════════════════════════════════════╣
║ [Post Content]                      ║
╚═════════════════════════════════════╝
```

## TypeScript Types

Updated `Activity` type in `/lib/types/database.ts`:

```typescript
export type Activity = {
  // ...existing fields...
  is_pinned?: boolean;
  is_highlighted?: boolean;
  pinned_at?: string | null;
}
```

## Notes

- Only admins can pin/highlight posts (via admin panel)
- Pinned posts maintain chronological order among themselves
- Multiple posts can be pinned simultaneously
- Feature works on all screen sizes (mobile responsive)
- No limit on number of pinned posts (but use judiciously for UX)

## Future Enhancements

Potential improvements:
- Limit number of pinned posts (e.g., max 3)
- Auto-unpin after X days
- Pin expiry date option
- Different highlight colors/themes
- Analytics for pinned post engagement
