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
