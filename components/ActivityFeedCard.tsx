"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { formatContent, decodeHtmlEntities as libDecode, escapeHtml } from '@/lib/formatContent';
import Link from 'next/link';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { formatPostTime } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Heart, Share2, MapPin, LayoutDashboard, ChevronLeft, ChevronRight, Eye, Edit } from "lucide-react";
import { computeSyntheticTargets, displayedMetric, growthFractionSince } from '@/lib/utils';
import EditMyActivityForm from '@/components/EditMyActivityForm';
import type { Activity } from "@/lib/types/database";

// --- FIX: Recursive Decoder ---
// This runs a loop to strip multiple layers of encoding (e.g. &amp;#039; -> &#039; -> ')
// It is pure string manipulation, so it works on both Server and Client without breaking hydration.
const recursiveDecode = (input: string) => {
  if (!input) return "";
  let curr = input;
  let prev = "";
  let loopCount = 0;

  // Loop until the string stops changing or we hit a safety limit (5 loops)
  while (curr !== prev && loopCount < 5) {
    prev = curr;
    curr = curr
      .replace(/&amp;#039;/g, "'")
      .replace(/&amp;#39;/g, "'")
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&amp;apos;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&amp;quot;/g, '"')
      .replace(/&quot;/g, '"')
      .replace(/&amp;amp;/g, '&');
    loopCount++;
  }
  return curr;
};

function CollapsibleContent({ contentHtml, onDoubleClick, onDoubleTapLike, isTextOnly = false, minLinesForToggle = 6 }: { contentHtml: string; onDoubleClick?: () => void; onDoubleTapLike?: () => void; isTextOnly?: boolean; minLinesForToggle?: number }) {
  const [expanded, setExpanded] = useState(false);
  
  // Apply the recursive decoder here to ensure the final HTML passed to the div is clean
  const finalHtml = recursiveDecode(contentHtml);
  
  const contentText = finalHtml.replace(/<[^>]*>/g, '');
  const shouldAttemptTruncate = contentText.trim().length > 150;
  const [needsTruncate, setNeedsTruncate] = useState(false);
  const [measuring, setMeasuring] = useState<boolean>(shouldAttemptTruncate);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!shouldAttemptTruncate) {
      setNeedsTruncate(false);
      setMeasuring(false);
      return;
    }

    const el = contentRef.current;
    if (!el) {
      setMeasuring(false);
      return;
    }

    const origDisplay = el.style.display;
    const origClamp = (el.style as any).WebkitLineClamp;
    const origBoxOrient = (el.style as any).WebkitBoxOrient;

    try {
      // 1. Unclamp to measure real height
      el.style.display = 'block';
      (el.style as any).WebkitLineClamp = '';
      (el.style as any).WebkitBoxOrient = '';

      requestAnimationFrame(() => {
        const fullHeight = el.scrollHeight;

        // Calculate approx line height
        let lineHeight = 0;
        try {
          const span = document.createElement('span');
          span.textContent = 'A';
          span.style.visibility = 'hidden';
          span.style.position = 'absolute';
          span.style.whiteSpace = 'nowrap';
          el.appendChild(span);
          const rect = span.getBoundingClientRect();
          lineHeight = rect.height || 0;
          el.removeChild(span);
        } catch (err) {}

        if (!lineHeight) {
          const cs = window.getComputedStyle(el);
          const fontSize = parseFloat(cs.fontSize || '16') || 16;
          lineHeight = Math.round(fontSize * 1.4);
        }

        const fullLines = Math.round(fullHeight / lineHeight);
        const exceedsMin = fullLines >= minLinesForToggle;

        // 2. Re-clamp to check if overflow happens visually
        el.style.display = '-webkit-box';
        (el.style as any).WebkitLineClamp = '3';
        (el.style as any).WebkitBoxOrient = 'vertical';

        requestAnimationFrame(() => {
          const isOverflowing = el.scrollHeight > el.clientHeight + 1;
          const willShow = isOverflowing && (!isTextOnly || (isTextOnly && exceedsMin));
          setNeedsTruncate(willShow);
          setMeasuring(false);

          // Restore original state (expanded vs collapsed logic handles the rest via render)
          el.style.display = origDisplay;
          (el.style as any).WebkitLineClamp = origClamp;
          (el.style as any).WebkitBoxOrient = origBoxOrient;
        });
      });
    } catch (e) {
      // Fallback
      setMeasuring(false);
    }
  }, [finalHtml, shouldAttemptTruncate, isTextOnly, minLinesForToggle]);

  return (
    <div className="mb-4 px-4 md:px-4 text-muted-foreground prose prose-sm max-w-none">
      <div
        ref={contentRef}
        onDoubleClick={onDoubleClick}
        // Formatting Fix: whitespace-pre-wrap ensures paragraphs are preserved
        className={`transition-all whitespace-pre-wrap break-words [&_p]:mb-3 [&_p:last-child]:mb-0 ${!expanded && (needsTruncate || measuring) ? 'overflow-hidden' : ''}`}
        // Line Clamp Logic
        style={!expanded && (needsTruncate || measuring) ? { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any } : {}}
        dangerouslySetInnerHTML={{ __html: finalHtml }}
      />

      {(!measuring && needsTruncate) && (
        <div className="mt-1">
          <button
            className="text-sm text-muted-foreground"
            onClick={() => setExpanded((s) => !s)}
            aria-expanded={expanded}
            style={{ background: 'transparent', border: 'none', padding: 0 }}
          >
            {!expanded ? '...more' : ' less'}
          </button>
        </div>
      )}
    </div>
  );
}

// ... Main Component ...

const TYPE_BADGE_CLASSES: Record<string, string> = {
  'Meetings': 'bg-sky-600',
  'Campaigns': 'bg-rose-600',
  'Protests': 'bg-red-600',
  'Drive': 'bg-green-600',
  'Plantation': 'bg-emerald-600',
  'News': 'bg-amber-600',
  'Other': 'bg-gray-600',
};

function badgeColorForType(type: string) {
  return TYPE_BADGE_CLASSES[type] || 'bg-gray-600';
}

interface ActivityFeedCardProps {
  activity: Activity;
}

export default function ActivityFeedCard({ activity }: ActivityFeedCardProps) {
  const supabase = createBrowserClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [localType, setLocalType] = useState(activity.type || 'Other');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Clean header fields
  const safeTitle = recursiveDecode(activity.title || '');
  const safeAuthor = recursiveDecode(activity.author_name || 'Unknown');
  const safeCaption = recursiveDecode((activity.image_captions && activity.image_captions[0]) || '');

  const resolveUrl = (u: string) => {
    if (!u) return u;
    try { new URL(u); return u; } 
    catch { 
      if (u.startsWith('/')) return `${typeof window !== 'undefined' ? window.location.origin : ''}${u}`; 
      return u; 
    }
  };

  const extractImageUrlsFromContent = (content?: string) => {
    if (!content) return [] as string[];
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico|jfif)(?:\?[^\s]*)?|\/uploads\/[^^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico|jfif)(?:\?[^\s]*)?)/gi;
    const matches = Array.from((content || '').matchAll(imageRegex)).map(m => m[0]);
    return matches;
  };

  const primaryImages: string[] = (activity.image_urls && activity.image_urls.length > 0)
    ? activity.image_urls.slice()
    : (activity.image_url ? [activity.image_url] : []);

  const inlineImages = extractImageUrlsFromContent(activity.content || '');
  const images = [...primaryImages];
  for (const u of inlineImages) { if (!images.includes(u)) images.push(u); }

  const [clientResolvedImages, setClientResolvedImages] = useState<string[] | null>(null);
  useEffect(() => {
    try { if (typeof window !== 'undefined') setClientResolvedImages(images.map(resolveUrl)); } catch (e) {}
  }, []);
  
  const [likes, setLikes] = useState(activity.likes_count);
  const [shares, setShares] = useState(activity.shares_count);
  const [liked, setLiked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalIndex, setModalIndex] = useState<number>(0);
  const [modalUseIframe, setModalUseIframe] = useState<boolean>(true);
  const [modalIframeLoaded, setModalIframeLoaded] = useState<boolean>(false);
  const modalIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);
  const touchStartTime = useRef<number | null>(null);
  const [transitionDuration, setTransitionDuration] = useState<number>(300);
  const CAR_POS_KEY = 'activity_carousel_pos_v1';
  const [shareAnimating, setShareAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showHeart, setShowHeart] = useState(false); 
  const previousLikesRef = useRef<number>(likes);
  const [realViews, setRealViews] = useState<number>((activity.views_count as any) || 0);
  const { viewsTarget, likesTarget, sharesTarget } = computeSyntheticTargets(activity as any);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000); 
    return () => clearInterval(id);
  }, []);

  const displayedViews = displayedMetric({ target: viewsTarget, createdAt: activity.activity_date, realCount: realViews });
  const displayedLikes = Math.max(likes, displayedMetric({ target: likesTarget, createdAt: activity.activity_date, realCount: likes }));
  const displayedShares = Math.max(shares, displayedMetric({ target: sharesTarget, createdAt: activity.activity_date, realCount: shares }));

  useEffect(() => {
    let mounted = true;
    const trySeed = async () => {
      try {
        if (displayedViews - realViews >= 3 && displayedViews < viewsTarget) {
          const lastKey = `last_seed_${activity.id}`;
          const raw = localStorage.getItem(lastKey);
          const last = raw ? parseInt(raw, 10) : 0;
          const now = Date.now();
          const COOLDOWN = 1000 * 60 * 10; 
          if (now - last > COOLDOWN) {
            const resp = await fetch('/api/activities/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activityId: activity.id }) });
            const json = await resp.json();
            if (json?.activity?.views_count != null) { setRealViews(json.activity.views_count); try { localStorage.setItem(lastKey, String(now)); } catch (e) {} }
          }
        }
        if (displayedLikes - likes >= 2 && displayedLikes < likesTarget) {
          const lastKey = `last_seed_likes_${activity.id}`;
          const raw = localStorage.getItem(lastKey);
          const last = raw ? parseInt(raw, 10) : 0;
          const now = Date.now();
          const COOLDOWN = 1000 * 60 * 30; 
          if (now - last > COOLDOWN) {
            const resp = await fetch('/api/activities/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activityId: activity.id }) });
            const json = await resp.json();
            if (json?.activity?.likes_count != null) { setLikes(json.activity.likes_count); try { localStorage.setItem(lastKey, String(now)); } catch (e) {} }
          }
        }
      } catch (e) {}
    };
    trySeed();
    return () => { mounted = false; };
  }, [displayedViews, realViews, viewsTarget, displayedLikes, likesTarget, likes, activity.id, tick]);

  useEffect(() => { checkLikeStatus(); }, [activity.id]);

  useEffect(() => {
    const handleImageModal = (event: CustomEvent<string>) => { setModalImage(event.detail); setModalOpen(true); };
    window.addEventListener('openImageModal', handleImageModal as EventListener);
    return () => { window.removeEventListener('openImageModal', handleImageModal as EventListener); };
  }, []);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      let vid = localStorage.getItem('visitor_id') ?? '';
      if (!vid) {
        const newVid = (window.crypto && (window.crypto as any).randomUUID) ? (window.crypto as any).randomUUID() : `v_${Math.random().toString(36).slice(2,10)}`;
        localStorage.setItem('visitor_id', newVid);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let mounted = true;
    const el = document.getElementById(`activity-${activity.id}`);
    if (!el) return;
    const observer = new IntersectionObserver(async (entries) => {
      for (const entry of entries) {
        if (!mounted) return;
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          try {
            const key = `viewed_v1_${activity.id}`;
            const raw = localStorage.getItem(key);
            const last = raw ? parseInt(raw, 10) : 0;
            const now = Date.now();
            const COOLDOWN = 1000 * 60 * 60;
            if (now - last > COOLDOWN) {
              const visitorId = localStorage.getItem('visitor_id');
              const resp = await fetch('/api/activities/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activityId: activity.id, visitorId }) });
              const json = await resp.json();
              if (json?.views_count != null) setRealViews(json.views_count);
              try { localStorage.setItem(key, String(now)); } catch (e) {}
            }
          } catch (e) {}
        }
      }
    }, { threshold: [0.5] });
    observer.observe(el);
    return () => { mounted = false; observer.disconnect(); };
  }, [activity.id, realViews, viewsTarget]);
  
  const openImageModal = (imageUrl: string) => {
    const resolved = resolveUrl(imageUrl);
    const idx = images.findIndex((u) => resolveUrl(u) === resolved);
    setModalIndex(idx >= 0 ? idx : 0);
    setModalImage(resolved);
    setModalUseIframe(true);
    setModalIframeLoaded(false);
    setModalOpen(true);
  };

  const nextImage = useCallback(() => { setCurrentIndex((i) => Math.min(images.length - 1, i + 1)); }, [images.length]);

  useEffect(() => {
    if (!modalOpen) return;
    let t: any = setTimeout(() => { if (!modalIframeLoaded) setModalUseIframe(false); }, 1500);
    const onMsg = (e: MessageEvent) => {
      if (e?.data?.type === 'iframe-image-loaded') {
        setModalIframeLoaded(true);
        const w = Number(e.data.w || 0);
        const h = Number(e.data.h || 0);
        if (w > 0 && h > 0 && modalIframeRef.current) {
          const targetW = Math.min(window.innerWidth * 0.75, 1200);
          const maxH = window.innerHeight * 0.9;
          let width = Math.round(targetW);
          let height = Math.round((targetW * h) / w);
          if (height > maxH) { height = Math.round(maxH); width = Math.round((maxH * w) / h); }
          modalIframeRef.current.style.width = `${width}px`;
          modalIframeRef.current.style.height = `${height}px`;
          modalIframeRef.current.style.maxWidth = `${targetW}px`;
          modalIframeRef.current.style.maxHeight = `${Math.round(maxH)}px`;
        }
      }
      if (e?.data?.type === 'iframe-image-error') setModalUseIframe(false);
    };
    window.addEventListener('message', onMsg);
    return () => { clearTimeout(t); window.removeEventListener('message', onMsg); };
  }, [modalOpen, modalIframeLoaded]);

  const prevImage = useCallback(() => { setCurrentIndex((i) => Math.max(0, i - 1)); }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    touchStartTime.current = Date.now();
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (touchStartX.current == null) return;
    const delta = touchDeltaX.current;
    const now = Date.now();
    const dt = touchStartTime.current ? (now - touchStartTime.current) : 1;
    const velocity = delta / dt; 
    const dur = Math.max(150, Math.min(600, Math.round(400 - Math.min(300, Math.abs(velocity) * 200))));
    setTransitionDuration(dur);
    if (Math.abs(delta) > 50 || Math.abs(velocity) > 0.3) { if (delta < 0) nextImage(); else prevImage(); }
    touchStartX.current = null;
    touchDeltaX.current = 0;
    touchStartTime.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (images.length <= 1) return;
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, nextImage, prevImage]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (profile && (profile as any).role === 'admin') { if (mounted) setIsAdmin(true); }
      } catch (e) {}
      try {
        const { data } = await supabase.from('activity_types').select('name').order('name');
        if (mounted && Array.isArray(data)) setTypeOptions(data.map((r:any)=>r.name));
        try { const { data: { user } } = await supabase.auth.getUser(); if (mounted) setCurrentUserId(user?.id ?? null); } catch (e) {}
      } catch {}
    })();
    return () => { mounted = false };
  }, [supabase]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CAR_POS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw || '{}');
        const pos = parsed?.[activity.id as any];
        if (typeof pos === 'number') setCurrentIndex(Math.min(Math.max(0, pos), Math.max(0, images.length - 1)));
      }
    } catch (e) {}
  }, [activity.id, images.length]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CAR_POS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[activity.id as any] = currentIndex;
      localStorage.setItem(CAR_POS_KEY, JSON.stringify(parsed));
    } catch (e) {}
  }, [currentIndex, activity.id]);

  useEffect(() => { setLocalType(activity.type || 'Other'); }, [activity.type]);

  const applyTypeUpdate = async (newType: string) => {
    try {
      const res = await fetch('/api/admin/update-activity-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activity.id, type: newType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || JSON.stringify(data));
      setLocalType(newType);
      setEditing(false);
    } catch (e:any) { alert('Error updating type: ' + (e.message||String(e))); }
  };

  useEffect(() => { (window as any).openImageModal = openImageModal; }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const containers = Array.from(document.querySelectorAll('.youtube-embed')) as HTMLElement[];
        for (const c of containers) {
          if (!mounted) return;
          const vid = c.getAttribute('data-video-id');
          if (!vid) continue;
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const resp = await fetch(`/api/youtube/check?id=${encodeURIComponent(vid)}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await resp.json();
            const origin = encodeURIComponent(window.location.origin);
            if (data?.embeddable) {
              const src = `https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1&origin=${origin}`;
              const thumb = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
              c.innerHTML = `<div class="w-full aspect-video overflow-hidden rounded-md"><iframe src="${src}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div><div class="mt-2"><a href="https://youtu.be/${vid}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-3"><img src="${thumb}" alt="Video thumbnail" class="w-36 h-20 object-cover rounded-md" /><span class="text-sm">Watch video on YouTube</span></a></div>`;
            } else {
              const thumb = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
              c.innerHTML = `<div class="mt-2"><a href="https://youtu.be/${vid}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-3"><img src="${thumb}" alt="Video thumbnail" class="w-36 h-20 object-cover rounded-md" /><span class="text-sm">Watch video on YouTube</span></a></div>`;
            }
          } catch (e) { if (mounted) c.innerHTML = `<p class="mt-2 text-sm"><a href="https://youtu.be/${vid}" target="_blank" rel="noopener noreferrer">Watch video on YouTube</a></p>`; }
        }
      } catch (e) {}
    })();
    return () => { mounted = false };
  }, []);

  const checkLikeStatus = async () => {
    try {
      const response = await fetch(`/api/like?activityId=${activity.id}`);
      const data = await response.json();
      setLiked(data.liked);
    } catch (error) { console.error('Error checking like status:', error); }
  };

  const handleLike = async ({ optimistic = true, showAnimation = false } = {}) => {
    if (loading) return;
    const prevLiked = liked;
    const prevCount = previousLikesRef.current;
    if (optimistic) {
      previousLikesRef.current = likes;
      if (prevLiked) { setLikes((s) => Math.max(0, s - 1)); setLiked(false); } 
      else { setLikes((s) => s + 1); setLiked(true); if (showAnimation) { setShowHeart(true); setTimeout(() => setShowHeart(false), 800); } }
    }
    setLoading(true);
    try {
      const response = await fetch('/api/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activityId: activity.id }), });
      const data = await response.json();
      if (typeof data.liked === 'boolean') {
        setLiked(Boolean(data.liked));
        if (!optimistic) { setLikes((s) => (data.liked ? s + 1 : Math.max(0, s - 1))); } 
        else { if (data.liked !== !prevLiked) { setLikes(previousLikesRef.current); setLiked(data.liked); } }
      }
    } catch (error) { if (optimistic) { setLiked(prevLiked); setLikes(prevCount); } } finally { setLoading(false); }
  };

  const handleShare = async () => {
    if (loading) return; 
    setLoading(true);
    const prev = shares;
    setShares((s) => s + 1);
    setShareAnimating(true);
    setTimeout(() => setShareAnimating(false), 900);
    let didShare = false;
    if (navigator.share) {
      try { await navigator.share({ title: activity.title, text: activity.content || "", url: window.location.href, }); didShare = true; } catch (err) { didShare = false; }
    } else {
      try { await navigator.clipboard.writeText(window.location.href); alert("Link copied to clipboard!"); didShare = true; } catch (e) { didShare = false; }
    }
    try {
      const visitorId = localStorage.getItem('visitor_id');
      const resp = await fetch('/api/activities/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activityId: activity.id, visitorId }) });
      const json = await resp.json();
      if (json?.shares_count != null) { setShares(json.shares_count); }
    } catch (e) { setShares(prev); } finally { setLoading(false); }
  };

  return (
    <>
      <div className="mx-0 sm:mx-auto w-full max-w-3xl overflow-hidden transition-shadow hover:shadow-2xl mb-3 rounded-none sm:rounded-xl bg-white border border-gray-200 sm:border-gray-200 shadow-sm">
        <div className="relative">
          {localType && (
            <div className="absolute right-2 md:right-4 top-2 md:top-4 z-10">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium text-white shadow transition-transform duration-300 transform hover:scale-105 ${badgeColorForType(localType)}`}>
                {localType}
              </span>
            </div>
          )}

          <div className="mb-0 flex items-start justify-between py-2 px-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-400 flex items-center justify-center text-sm font-medium text-white shadow">{safeAuthor.split(' ').map(s=>s[0]||'').slice(0,2).join('').toUpperCase()}</div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{safeAuthor}</div>
                  <div className="text-xs text-muted-foreground">{formatPostTime(activity.activity_date)}</div>
                </div>
                {activity.location && (
                  <div className="mt-0 text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{activity.location}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link href="/admin/dashboard" title="Admin Panel" className="text-muted-foreground p-1.5 rounded-full hover:bg-gray-100">
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          {images && images.length > 0 && (
            <div className="w-full bg-black/5">
              <div className="w-full h-96 md:h-[520px] relative overflow-hidden bg-white">
                <div
                  className="w-full h-full flex"
                  style={{ transform: `translateX(-${currentIndex * 100}%)`, transitionProperty: 'transform', transitionDuration: `${transitionDuration}ms` }}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  {(clientResolvedImages ?? images).map((src, idx) => (
                    <div key={idx} className="w-full flex-shrink-0 h-full">
                      <img
                        src={src}
                        alt={`Image ${idx+1}`}
                        className="w-full h-full object-cover cursor-pointer bg-white"
                        onClick={() => openImageModal(images[idx])}
                        onDoubleClick={() => handleLike({ optimistic: true, showAnimation: true })}
                      />
                    </div>
                  ))}
                </div>

                {images.length > 1 && (
                  <>
                    <button
                      aria-label="Previous"
                      aria-disabled={currentIndex === 0}
                      title={currentIndex === 0 ? 'No previous image' : 'Previous image'}
                      onClick={prevImage}
                      disabled={currentIndex === 0}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 z-30 rounded-full shadow-lg p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${currentIndex === 0 ? 'bg-white/90 text-gray-400 cursor-not-allowed opacity-80' : 'bg-primary/50 text-white hover:bg-primary/60'}`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      aria-label="Next"
                      aria-disabled={currentIndex === (images.length - 1)}
                      title={currentIndex === (images.length - 1) ? 'No next image' : 'Next image'}
                      onClick={nextImage}
                      disabled={currentIndex === (images.length - 1)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 z-30 rounded-full shadow-lg p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${currentIndex === (images.length - 1) ? 'bg-white/90 text-gray-400 cursor-not-allowed opacity-80' : 'bg-primary/50 text-white hover:bg-primary/60'}`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                {showHeart && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="animate-ping-slow text-6xl text-emerald-500 drop-shadow-lg">❤</div>
                  </div>
                )}
              </div>
              {safeCaption && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-muted-foreground">{safeCaption}</p>
                </div>
              )}

              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setCurrentIndex(i)} className={`h-2 w-2 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-white/50'}`} aria-label={`Go to image ${i+1}`} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activity.video_url && (
            <div className="w-full bg-black/5 px-4 md:px-4 mb-8 clear-both">
              <div className="w-full max-w-3xl mx-auto">
                {activity.video_url.includes('drive.google.com') ? (
                  <div className="drive-video-embed w-full aspect-video bg-gray-100 rounded-md overflow-hidden">
                    <iframe src={`https://drive.google.com/file/d/${activity.video_url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]}/preview`} width="100%" height="100%" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
                  </div>
                ) : activity.video_url.includes('twitter.com') || activity.video_url.includes('x.com') ? (
                  <div className="twitter-video-embed w-full bg-gray-100 rounded-md overflow-hidden flex justify-center py-4">
                    <div className="w-full flex justify-center">
                      <iframe src={`https://platform.x.com/embed/Tweet.html?id=${activity.video_url.match(/\/status\/([0-9]+)/)?.[1]}`} width="100%" height="600" frameBorder="0" scrolling="no" allowFullScreen className="w-full max-w-md md:max-w-lg lg:max-w-2xl border-0" style={{ minHeight: '600px' }}></iframe>
                    </div>
                  </div>
                ) : activity.video_url.includes('youtube.com') || activity.video_url.includes('youtu.be') ? (
                  <div className="youtube-embed">
                    <div className="youtube-placeholder w-full aspect-video bg-gray-100 rounded-md overflow-hidden">
                      <iframe src={`https://www.youtube.com/embed/${activity.video_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/(?:v|e(?:mbed)?)\/(?:v|e(?:mbed)?)\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1]}`} width="100%" height="100%" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-gray-100 rounded-md overflow-hidden">
                    <iframe src={activity.video_url} width="100%" height="100%" frameBorder="0" allowFullScreen className="w-full h-full"></iframe>
                  </div>
                )}
              </div>
            </div>
          )}

          {safeTitle.trim() !== '' && (
            <div className="px-4 md:px-4 mt-3 mb-4">
              <h2 className="text-lg md:text-xl font-semibold leading-tight">{safeTitle}</h2>
            </div>
          )}

          <CollapsibleContent
            // Pass content to formatting chain which includes our new sanitizer
            contentHtml={formatContent(activity.content || '', images)}
            onDoubleClick={() => handleLike({ optimistic: true, showAnimation: true })}
            onDoubleTapLike={() => handleLike({ optimistic: true, showAnimation: true })}
            isTextOnly={images.length === 0}
            minLinesForToggle={6}
          />

          {images.length > 1 && (
            <div className="mb-4 flex justify-center">
              <div className="flex gap-2 items-center">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setCurrentIndex(i)} className={`h-2 w-2 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-white/50'}`} aria-label={`Go to image ${i+1}`} />
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="mb-4 px-4 md:px-4">
              {editing ? (
                <div className="flex items-center gap-2">
                  <select className="rounded border px-2 py-1" value={localType} onChange={(e)=>setLocalType(e.target.value)}>
                    {typeOptions.length > 0 ? typeOptions.map(t=> <option key={t} value={t}>{t}</option>) : <option value={localType}>{localType}</option>}
                  </select>
                  <button onClick={()=>applyTypeUpdate(localType)} className="rounded bg-primary px-3 py-1 text-white">Save</button>
                  <button onClick={()=>{ setEditing(false); setLocalType(activity.type || 'Other'); }} className="text-sm text-muted-foreground">Cancel</button>
                </div>
              ) : (
                <div className="text-sm">
                  <button onClick={()=>setEditing(true)} className="text-primary underline">Quick edit type</button>
                </div>
              )}
            </div>
          )}

          <div className="mb-4 border-t pt-3 px-4 md:px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button aria-pressed={liked} onClick={() => { handleLike({ optimistic: true, showAnimation: !liked }); setShowHeart(true); setTimeout(()=>setShowHeart(false),800); }} className="flex items-center gap-2 rounded-full p-2 hover:bg-gray-100 transition">
                  <Heart className={`h-5 w-5 transition-transform duration-200 ${liked ? 'text-rose-600 scale-125 animate-pulse' : 'text-gray-700'}`} />
                  <span className={`text-sm font-medium transition-transform duration-200 ${liked ? 'scale-110' : ''}`}>{displayedLikes}</span>
                </button>
                <button onClick={handleShare} disabled={loading} className="flex items-center gap-2 rounded-full p-2 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  <Share2 className={`h-5 w-5 ${shareAnimating ? 'text-emerald-600 animate-pulse' : 'text-gray-700'}`} />
                  <span className="text-sm">{displayedShares}</span>
                </button>
                <div className="flex items-center gap-2 rounded-full p-2 text-muted-foreground">
                  <Eye className="h-5 w-5 text-gray-700" />
                  <span className="text-sm">{displayedViews}</span>
                </div>
                {(currentUserId && String(currentUserId) === String(activity.author_id)) && (
                  <button onClick={()=>setShowEditModal(true)} aria-label="Edit post" className="p-2 rounded hover:bg-gray-100 text-muted-foreground"><Edit className="h-5 w-5" /></button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost">Comment</Button>
                {isAdmin && <Button size="sm" variant="outline">Edit</Button>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModalOpen(false)}>
          <div className="relative mx-4 max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-2 right-2 z-50">
              <button onClick={() => setModalOpen(false)} className="rounded-full bg-white/90 p-2 text-sm">✕</button>
            </div>
            {(() => {
              const getOriginalUrl = (u: string) => {
                if (!u) return u;
                if (u.startsWith('data:')) return u;
                try {
                  const url = new URL(u, window.location.origin);
                  ['w', 'width', 'h', 'height', 'fit', 'crop', 'f', 'q', 'quality', 's', 'auto'].forEach(p => url.searchParams.delete(p));
                  url.pathname = url.pathname.replace(/\/upload\/c_[^/]+(,[^/]+)*\//, '/upload/');
                  url.pathname = url.pathname.replace(/\/\-\/preview\//, '/');
                  return url.toString();
                } catch (e) { return u; }
              };
              const full = getOriginalUrl(modalImage);
              return (
                <div className="relative">
                  {modalUseIframe ? (
                    (() => {
                      const iframeDoc = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1" /><style>html,body{height:100%;margin:0;background:#fff;display:flex;align-items:center;justify-content:center}img{display:block;max-width:100%;max-height:100%;margin:0 auto;object-fit:contain}</style></head><body><img id="_img" src="${full}" alt="image" onload="(function(){var i=document.getElementById('_img');window.parent.postMessage({type:'iframe-image-loaded',w:i.naturalWidth,h:i.naturalHeight},'*')})()" onerror="window.parent.postMessage({type:'iframe-image-error'},'*')"/></body></html>`;
                      return <iframe ref={modalIframeRef} title="Full image frame" srcDoc={iframeDoc} className="rounded-md bg-white" style={{ border: 'none', width: 'auto', maxHeight: '90vh' }} />
                    })()
                  ) : (
                    <img src={full} alt="Full image" className="max-h-[80vh] max-w-[80vw] object-contain rounded-md bg-white" />
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={()=>setShowEditModal(false)}>
          <div className="bg-white rounded-md p-4 w-full max-w-3xl mx-4 max-h-[90vh] overflow-auto" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Edit Post</h3>
              <button onClick={()=>setShowEditModal(false)} className="text-muted-foreground">Close</button>
            </div>
            <EditMyActivityForm activity={activity} onCancel={()=>setShowEditModal(false)} onSuccess={(updated)=>{ setShowEditModal(false); window.location.reload(); }} />
          </div>
        </div>
      )}
    </>
  );
}
