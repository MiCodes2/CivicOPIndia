import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateShort(date?: string | Date) {
  if (!date) return "";
  const d = new Date(date);
  try {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(d);
  } catch (e) {
    // fallback
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yy = d.getUTCFullYear();
    return `${dd}/${mm}/${yy}`;
  }
}

export function formatDateLong(date?: string | Date) {
  if (!date) return "";
  const d = new Date(date);
  try {
    return new Intl.DateTimeFormat('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(d);
  } catch (e) {
    // fallback
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yy = d.getUTCFullYear();
    return `${dd}/${mm}/${yy}`;
  }
}

export function formatPostTime(date?: string | Date) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Less than a minute
  if (diffSecs < 60) return 'just now';
  
  // Less than an hour - show minutes
  if (diffMins < 60) return `${diffMins}m ago`;
  
  // Less than 24 hours - show hours
  if (diffHours < 24) return `${diffHours}hr ago`;
  
  // 1-2 days - show "yesterday" or "2 days ago"
  if (diffDays === 1) return 'yesterday';
  if (diffDays === 2) return '2 days ago';

  // Older - show exact date
  const isOlderThanYear = diffDays > 365;

  try {
    if (isOlderThanYear) {
      return new Intl.DateTimeFormat('en-GB', { month: 'short', day: '2-digit', year: 'numeric' }).format(d);
    }
    return new Intl.DateTimeFormat('en-GB', { month: 'short', day: '2-digit' }).format(d);
  } catch (e) {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (isOlderThanYear) return `${monthNames[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')}, ${d.getFullYear()}`;
    return `${monthNames[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')}`;
  }
}

// Format event date with time
export function formatEventDateTime(date?: string | Date) {
  if (!date) return "";
  const d = new Date(date);
  
  try {
    return new Intl.DateTimeFormat('en-IN', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch (e) {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const hours = d.getHours();
    const mins = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${monthNames[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')}, ${d.getFullYear()} ${h12}:${String(mins).padStart(2,'0')} ${ampm}`;
  }
}

export function extractHashtags(content?: string) {
  if (!content) return [] as string[];
  // strip HTML tags
  const text = content.replace(/<[^>]*>/g, ' ');
  const re = /#([a-zA-Z0-9_\-]+)/g;
  const set = new Set<string>();
  let match;
  // collect lowercased unique tags
  // eslint-disable-next-line no-cond-assign
  while ((match = re.exec(text)) !== null) {
    const t = (match[1] || '').toLowerCase();
    if (t) set.add(t);
  }
  return Array.from(set);
}

// --- Synthetic metric helpers -------------------------------------------------

function seededRandom(seed: string) {
  // simple mulberry32-like seeded RNG based on string
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  }
  return function() {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// returns an object of synthetic targets (deterministic from id + created date)
export function computeSyntheticTargets(activity: any) {
  const likes = (activity.likes_count || 0) as number;
  const shares = (activity.shares_count || 0) as number;
  const seedStr = `${activity.id}-${activity.created_at || ''}`;
  const rand = seededRandom(seedStr);

  // Views target: between 100x and 500x likes (if likes==0, pick a small base)
  const multiplier = Math.round(100 + Math.floor(rand() * 401)); // 100..500
  const baseLikes = Math.max(1, likes || Math.round(1 + Math.floor(rand() * 3)));
  const viewsTarget = Math.max(1, Math.round(baseLikes * multiplier));

  // Likes target (synthetic): small percent of views (0.5% - 2.0%) but at least current likes
  const likePct = 0.005 + rand() * 0.015;
  const likesTargetRaw = Math.max(likes, Math.max(1, Math.round(viewsTarget * likePct)));
  // Cap synthetic likes to +25% of the initial assigned likes (baseLikes)
  const likesCap = Math.max(likes, Math.round(baseLikes * 1.25));
  const likesTarget = Math.min(likesTargetRaw, likesCap);

  // Shares target: derive from likesTarget to keep shares proportional to likes (10% - 15% of likes)
  const sharePct = 0.10 + rand() * 0.05; // 10% .. 15%
  let sharesTarget = Math.max(shares, Math.max(0, Math.round(likesTarget * sharePct)));
  // Ensure shares never exceed likesTarget
  sharesTarget = Math.min(sharesTarget, likesTarget);

  return { viewsTarget, likesTarget, sharesTarget };
}

// Growth progress over time: smooth ease-in/ease-out exponential curve
// We use a damped exponential mapping so that ~80% of the growth is reached around day 3
// and 100% by day 7. This produces a smooth, non-linear increase.
export function growthFractionSince(createdAt: string | Date) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - created.getTime());
  const days = diffMs / (1000 * 60 * 60 * 24);
  if (days <= 0) return 0;
  if (days >= 7) return 1;

  // Exponential ease curve: f(d) = (1 - e^{-a*d}) / (1 - e^{-a*7}), choose a so that f(3)≈0.8
  // Empirically a = 0.5 gives f(3) ≈ 0.80 which matches the requirement
  const a = 0.5;
  const num = 1 - Math.exp(-a * days);
  const den = 1 - Math.exp(-a * 7);
  return Math.max(0, Math.min(1, num / den));
}

// Compute displayed metric for a target and optional realCount (realCount overrides once greater)
export function displayedMetric({ target, createdAt, realCount = 0 }: { target: number; createdAt: string | Date; realCount?: number }) {
  const frac = growthFractionSince(createdAt);
  const synthetic = Math.round(target * frac);
  return Math.max(realCount || 0, synthetic);
}
