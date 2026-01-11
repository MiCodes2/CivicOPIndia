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
  const observedLikes = (activity.likes_count || 0) as number;
  const observedShares = (activity.shares_count || 0) as number;
  // Use stored initial counts when available; fallback to observed counts
  const initialLikes = (activity.initial_likes_count ?? observedLikes) as number;
  const initialShares = (activity.initial_shares_count ?? observedShares) as number;

  const seedStr = `${activity.id}-${activity.created_at || ''}`;
  const rand = seededRandom(seedStr);

  // Deterministic assigned base likes independent of current counts to prevent positive feedback loops
  const assignedBaseLikes = Math.max(1, Math.round(1 + Math.floor(rand() * 3)));

  // Views target: between 100x and 500x of the assigned base likes
  const multiplier = Math.round(100 + Math.floor(rand() * 401)); // 100..500
  let viewsTarget = Math.max(1, Math.round(assignedBaseLikes * multiplier));


  // Likes target (synthetic): small percent of views (0.5% - 2.0%)
  const likePct = 0.005 + rand() * 0.015;
  const likesTargetRaw = Math.max(1, Math.round(viewsTarget * likePct));

  // Cap multiplier for synthetic relative to initial assigned/seeded likes to avoid runaway growth coming only from synthetic increases
  // Allow configuration via env var SYNTHETIC_MAX_MULTIPLIER (default 5)
  const envMul = typeof process !== 'undefined' && process.env && process.env.SYNTHETIC_MAX_MULTIPLIER ? parseInt(process.env.SYNTHETIC_MAX_MULTIPLIER) : NaN;
  const MAX_MULTIPLIER = Number.isFinite(envMul) && envMul > 0 ? envMul : 5;

  // Compute likes cap based on initial likes; if initialLikes is zero, fallback to a small cap based on assigned base likes
  const likesCapFromInitial = Math.max(initialLikes, Math.round(initialLikes * MAX_MULTIPLIER));
  const likesCapFallback = Math.max(assignedBaseLikes, Math.round(assignedBaseLikes * 1.25));
  const likesCap = initialLikes > 0 ? likesCapFromInitial : likesCapFallback;

  // Absolute environment caps (moderate defaults): likes ≤ 1500, shares ≤ 120, views ≤ 500k
  const envMaxLikes = typeof process !== 'undefined' && process.env && process.env.SYNTHETIC_MAX_LIKES ? parseInt(process.env.SYNTHETIC_MAX_LIKES) : NaN;
  const MAX_LIKES = Number.isFinite(envMaxLikes) && envMaxLikes > 0 ? envMaxLikes : 200;
  const envMaxShares = typeof process !== 'undefined' && process.env && process.env.SYNTHETIC_MAX_SHARES ? parseInt(process.env.SYNTHETIC_MAX_SHARES) : NaN;
  const MAX_SHARES = Number.isFinite(envMaxShares) && envMaxShares > 0 ? envMaxShares : 200;
  const envMaxViews = typeof process !== 'undefined' && process.env && process.env.SYNTHETIC_MAX_VIEWS ? parseInt(process.env.SYNTHETIC_MAX_VIEWS) : NaN;
  const MAX_VIEWS = Number.isFinite(envMaxViews) && envMaxViews > 0 ? envMaxViews : 500000;

  let likesTarget = Math.min(likesTargetRaw, likesCap, MAX_LIKES);
  // Never set synthetic target below actual observed likes
  if (observedLikes > likesTarget) likesTarget = observedLikes;

  // Shares target: derive from likesTarget to keep shares proportional to likes
  // Use a baseline of 100 shares per 1500 likes (~6.67%) with slight seeded variation
  const baseSharePct = 100 / 1500; // ~0.0666667
  const sharePct = baseSharePct * (0.9 + rand() * 0.2); // ±10% variation
  let sharesTarget = Math.max(observedShares, Math.max(0, Math.round(likesTarget * sharePct)));

  // Cap shares relative to initial shares as well: don't exceed initial_shares * MAX_MULTIPLIER unless driven by real interactions
  const sharesCapFromInitial = initialShares > 0 ? Math.max(initialShares, Math.round(initialShares * MAX_MULTIPLIER)) : Infinity;
  sharesTarget = Math.min(sharesTarget, sharesCapFromInitial, MAX_SHARES, likesTarget);
  // Never set synthetic shares below actual observed shares
  if (observedShares > sharesTarget) sharesTarget = observedShares;

  // Now compute views target *from* the finalized likesTarget to follow the 100..150x rule
  const viewMultiplier = 100 + Math.floor(rand() * 51); // 100..150
  viewsTarget = Math.min(MAX_VIEWS, Math.round(likesTarget * viewMultiplier));

  return { viewsTarget, likesTarget, sharesTarget };
}

// Apply a deterministic, seeded jitter to make 'perfect' cap numbers less suspicious
export function applyDisplayJitter({ value, cap, id, key, realCount = 0 }: { value: number; cap: number; id: string | number; key: string; realCount?: number }) {
  const capped = Math.min(value, cap);
  // If not at cap, just ensure not below realCount
  if (capped < cap) return Math.max(capped, realCount || 0);

  // At cap — apply small deterministic reduction (1% - 5%) based on seed
  const rand = seededRandom(`${id}-${key}-jitter`);
  const pct = 0.01 + rand() * 0.04; // 1% .. 5%
  const reduce = Math.max(1, Math.round(capped * pct));
  let jittered = capped - reduce;
  // Ensure jittered value is not an exact multiple of 10 (helps avoid suspicious "round" numbers)
  if (jittered % 10 === 0) {
    // use seeded choice to decide whether to add or subtract a small offset (1..3)
    const dirRand = rand();
    const offset = 1 + Math.floor(dirRand * 3); // 1..3
    if (jittered - offset >= (realCount || 0)) {
      jittered = jittered - offset;
    } else {
      // If subtracting would go below realCount, try adding but don't exceed cap
      jittered = Math.min(capped, jittered + offset);
      // If still multiple of 10 (edge case), subtract 1 safely
      if (jittered % 10 === 0 && jittered - 1 >= (realCount || 0)) {
        jittered = jittered - 1;
      }
    }
  }
  return Math.max(jittered, realCount || 0);
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

// Growth fraction normalized to reach 1 by a specified number of days (e.g., reachDays=3)
export function growthFractionToReach(createdAt: string | Date, reachDays: number) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - created.getTime());
  const days = diffMs / (1000 * 60 * 60 * 24);
  if (days <= 0) return 0;
  if (days >= reachDays) return 1;

  // Use a steeper exponential so the function reaches 1 at reachDays
  const a = 1.0; // steeper than default
  const num = 1 - Math.exp(-a * days);
  const den = 1 - Math.exp(-a * reachDays);
  return Math.max(0, Math.min(1, num / den));
}

// Compute displayed metric with respect to an optional initial target that should be reached in `reachDays` (e.g., 3 days). If no initialTarget provided, falls back to `displayedMetric`.
export function displayedMetricWithInitial({ target, initialTarget = 0, createdAt, realCount = 0, reachDays = 3 }: { target: number; initialTarget?: number; createdAt: string | Date; realCount?: number; reachDays?: number }) {
  if (!initialTarget || initialTarget <= 0) return displayedMetric({ target, createdAt, realCount });

  const fracBase = growthFractionToReach(createdAt, reachDays);
  const fracExtra = growthFractionSince(createdAt);

  const basePart = Math.round(initialTarget * fracBase);
  const extraPart = Math.round(Math.max(0, target - initialTarget) * fracExtra);
  const synthetic = basePart + extraPart;
  return Math.max(realCount || 0, synthetic);
}

// Compute displayed metric for a target and optional realCount (realCount overrides once greater)
export function displayedMetric({ target, createdAt, realCount = 0 }: { target: number; createdAt: string | Date; realCount?: number }) {
  const frac = growthFractionSince(createdAt);
  const synthetic = Math.round(target * frac);
  return Math.max(realCount || 0, synthetic);
}

// --- Caps (usable on both server and client) ---------------------------------
export function getMaxLikes() {
  // Prefer NEXT_PUBLIC_* env var for client visibility
  if (typeof window !== 'undefined') {
    const v = (process.env.NEXT_PUBLIC_SYNTHETIC_MAX_LIKES || process.env.SYNTHETIC_MAX_LIKES) as any;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 2000;
  }
  const n = Number(process.env.SYNTHETIC_MAX_LIKES);
  return Number.isFinite(n) && n > 0 ? n : 2000;
}

export function getMaxShares() {
  if (typeof window !== 'undefined') {
    const v = (process.env.NEXT_PUBLIC_SYNTHETIC_MAX_SHARES || process.env.SYNTHETIC_MAX_SHARES) as any;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 200;
  }
  const n = Number(process.env.SYNTHETIC_MAX_SHARES);
  return Number.isFinite(n) && n > 0 ? n : 200;
}

export function getMaxViews() {
  if (typeof window !== 'undefined') {
    const v = (process.env.NEXT_PUBLIC_SYNTHETIC_MAX_VIEWS || process.env.SYNTHETIC_MAX_VIEWS) as any;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 1000000;
  }
  const n = Number(process.env.SYNTHETIC_MAX_VIEWS);
  return Number.isFinite(n) && n > 0 ? n : 1000000;
}
