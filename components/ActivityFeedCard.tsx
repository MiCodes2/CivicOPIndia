"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import { formatDateShort, formatDateLong } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Heart, Share2, Calendar, MapPin } from "lucide-react";
import type { Activity } from "@/lib/types/database";

const TYPE_BADGE_CLASSES: Record<string, string> = {
  'Meetings': 'bg-sky-600',
  'Campaigns': 'bg-rose-600',
  'Protests': 'bg-red-600',
  'Workshops': 'bg-indigo-600',
  'Drive': 'bg-green-600',
  'Tree Plantation': 'bg-emerald-600',
  'Rally': 'bg-yellow-600',
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
  const images = (activity.image_urls && activity.image_urls.length > 0)
    ? activity.image_urls
    : activity.image_url
      ? [activity.image_url]
      : [];
  const [likes, setLikes] = useState(activity.likes_count);
  const [shares, setShares] = useState(activity.shares_count);
  const [liked, setLiked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalIndex, setModalIndex] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);
  const touchStartTime = useRef<number | null>(null);
  const [transitionDuration, setTransitionDuration] = useState<number>(300);
  const CAR_POS_KEY = 'activity_carousel_pos_v1';
  const [shareAnimating, setShareAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showHeart, setShowHeart] = useState(false); // small animation on double-tap
  const doubleTapRef = useRef(false);
  const touchLastTap = useRef<number | null>(null);
  const previousLikesRef = useRef<number>(likes);

  // Check if user already liked this activity
  useEffect(() => {
    checkLikeStatus();
  }, [activity.id]);

  // Add event listener for embedded image clicks
  useEffect(() => {
    const handleImageModal = (event: CustomEvent<string>) => {
      setModalImage(event.detail);
      setModalOpen(true);
    };

    window.addEventListener('openImageModal', handleImageModal as EventListener);

    return () => {
      window.removeEventListener('openImageModal', handleImageModal as EventListener);
    };
  }, []);

  const openImageModal = (imageUrl: string) => {
    const idx = images.findIndex((u) => u === imageUrl);
    setModalIndex(idx >= 0 ? idx : 0);
    setModalImage(imageUrl);
    setModalOpen(true);
  };

  const nextImage = useCallback(() => {
    setCurrentIndex((i) => Math.min(images.length - 1, i + 1));
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  // touch handlers for swipe carousel
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
    const velocity = delta / dt; // px per ms
    // compute transition duration that depends on swipe speed (faster swipe => shorter duration)
    const dur = Math.max(150, Math.min(600, Math.round(400 - Math.min(300, Math.abs(velocity) * 200))));
    setTransitionDuration(dur);

    // decide navigation: either by distance or by velocity
    if (Math.abs(delta) > 50 || Math.abs(velocity) > 0.3) {
      if (delta < 0) nextImage(); else prevImage();
    }

    touchStartX.current = null;
    touchDeltaX.current = 0;
    touchStartTime.current = null;
  };

  // keyboard navigation for carousel
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
        if (profile && (profile as any).role === 'admin') {
          if (mounted) setIsAdmin(true);
        }
      } catch (e) {
        // ignore
      }

      try {
        const { data } = await supabase.from('activity_types').select('name').order('name');
        if (mounted && Array.isArray(data)) setTypeOptions(data.map((r:any)=>r.name));
      } catch {}
    })();
    return () => { mounted = false };
  }, [supabase]);

  // Load persisted carousel position for this activity
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CAR_POS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw || '{}');
        const pos = parsed?.[activity.id as any];
        if (typeof pos === 'number') setCurrentIndex(Math.min(Math.max(0, pos), Math.max(0, images.length - 1)));
      }
    } catch (e) {
      // ignore
    }
  }, [activity.id, images.length]);

  // Persist carousel position when it changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CAR_POS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[activity.id as any] = currentIndex;
      localStorage.setItem(CAR_POS_KEY, JSON.stringify(parsed));
    } catch (e) {
      // ignore
    }
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
    } catch (e:any) {
      alert('Error updating type: ' + (e.message||String(e)));
    }
  };

  // Make openImageModal available globally for onclick handlers
  useEffect(() => {
    (window as any).openImageModal = openImageModal;
  }, []);

  // Render iframe only after confirming embeddability (avoids blocked iframes); inserts origin param
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
          } catch (e) {
            if (mounted) c.innerHTML = `<p class="mt-2 text-sm"><a href="https://youtu.be/${vid}" target="_blank" rel="noopener noreferrer">Watch video on YouTube</a></p>`;
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false };
  }, []);

  const checkLikeStatus = async () => {
    try {
      const response = await fetch(`/api/like?activityId=${activity.id}`);
      const data = await response.json();
      setLiked(data.liked);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async ({ optimistic = true, showAnimation = false } = {}) => {
    if (loading) return;

    const prevLiked = liked;
    const prevCount = previousLikesRef.current;

    // Optimistic update
    if (optimistic) {
      previousLikesRef.current = likes;
      if (prevLiked) {
        setLikes((s) => Math.max(0, s - 1));
        setLiked(false);
      } else {
        setLikes((s) => s + 1);
        setLiked(true);
        if (showAnimation) {
          setShowHeart(true);
          setTimeout(() => setShowHeart(false), 800);
        }
      }
    }

    setLoading(true);
    try {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: activity.id }),
      });

      const data = await response.json();

      // Reconcile with server
      if (typeof data.liked === 'boolean') {
        setLiked(Boolean(data.liked));
        // ensure correct count based on server (best-effort)
        if (!optimistic) {
          setLikes((s) => (data.liked ? s + 1 : Math.max(0, s - 1)));
        } else {
          // If server disagrees, adjust
          if (data.liked && !prevLiked) {
            // already incremented
          } else if (!data.liked && prevLiked) {
            // already decremented
          } else if (data.liked !== !prevLiked) {
            // reconcile counts - fallback to previous value adjustments
            setLikes(previousLikesRef.current);
            setLiked(data.liked);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic changes on error
      if (optimistic) {
        setLiked(prevLiked);
        setLikes(prevCount);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    setShares(shares + 1);
    setShareAnimating(true);
    setTimeout(() => setShareAnimating(false), 900);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: activity.title,
          text: activity.content || "",
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <>
        <Card className="-mx-4 sm:mx-auto w-full max-w-3xl overflow-hidden transition-shadow hover:shadow-2xl mb-3 rounded-none sm:rounded-xl px-0 md:px-2">
        <CardContent className="p-0 px-0 relative bg-white">
        {/* Type badge */}
        {localType && (
          <div className="absolute right-3 md:right-4 top-3 md:top-4 z-10">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium text-white shadow transition-transform duration-300 transform hover:scale-105 ${badgeColorForType(localType)}`}>
              {localType}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="mb-0 flex items-start justify-between py-2 px-3 md:px-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-400 flex items-center justify-center text-sm font-medium text-white shadow">{(activity.author_name||'').split(' ').map(s=>s[0]||'').slice(0,2).join('').toUpperCase()}</div>
            <div>
              <div className="text-sm font-medium">{activity.author_name || 'Unknown'}</div>
              <div className="text-xs text-muted-foreground">{formatDateShort(activity.activity_date)}</div>
            </div>
          </div>
              <div className="flex items-center gap-2">
            {/* type badge intentionally rendered at top-right as absolute element to avoid duplication */}
          </div>
        </div>

        {/* Featured image centered above content */}
        {images && images.length > 0 && (
          <div className="-mx-4 sm:mx-0 w-full bg-black/5">
            <div className="w-full h-96 md:h-[520px] relative overflow-hidden bg-black">
              <div
                className="w-full h-full flex"
                style={{ transform: `translateX(-${currentIndex * 100}%)`, transitionProperty: 'transform', transitionDuration: `${transitionDuration}ms` }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {images.map((src, idx) => (
                  <div key={idx} className="sm:w-full w-screen flex-shrink-0 h-full">
                    <img
                      src={src}
                      alt={`Image ${idx+1}`}
                      className="sm:w-full w-screen h-full object-cover cursor-pointer"
                      onClick={() => openImageModal(src)}
                      onDoubleClick={() => handleLike({ optimistic: true, showAnimation: true })}
                    />
                  </div>
                ))}
              </div>

              {/* Overlay arrows for desktop */}
              {images.length > 1 && (
                <>
                  <button aria-label="Previous" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 hidden md:block">◀</button>
                  <button aria-label="Next" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 hidden md:block">▶</button>
                </>
              )}
              {showHeart && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="animate-ping-slow text-6xl text-emerald-500 drop-shadow-lg">❤</div>
                </div>
              )}
            </div>
            {activity.image_captions && activity.image_captions[0] && (
              <div className="mt-2 text-center">
                <p className="text-sm text-muted-foreground">{activity.image_captions[0]}</p>
              </div>
            )}

            {/* Carousel indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setCurrentIndex(i)} className={`h-2 w-2 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-white/50'}`} aria-label={`Go to image ${i+1}`} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post content */}
        <div
          className="mb-4 px-3 md:px-4 text-muted-foreground prose prose-sm max-w-none"
          onDoubleClick={() => handleLike({ optimistic: true, showAnimation: true })}
          onTouchStart={() => {
            const now = Date.now();
            if (touchLastTap.current && (now - touchLastTap.current) < 300) {
              touchLastTap.current = null;
              handleLike({ optimistic: true, showAnimation: true });
            } else {
              touchLastTap.current = now;
            }
          }}
          dangerouslySetInnerHTML={{ __html: formatContent(activity.content || '') }}
        />

        {/* Thumbnails / additional images as centered horizontal strip */}
        {/* indicators only (thumbnails removed for Instagram-style swipe) */}
        {images.length > 1 && (
          <div className="mb-4 flex justify-center">
            <div className="flex gap-2 items-center">
              {images.map((_, i) => (
                <button key={i} onClick={() => setCurrentIndex(i)} className={`h-2 w-2 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-white/50'}`} aria-label={`Go to image ${i+1}`} />
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="mb-4 space-y-2 text-sm text-muted-foreground px-3 md:px-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDateLong(activity.activity_date)}</span>
          </div>
          {activity.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{activity.location}</span>
            </div>
          )}
        </div>

        {/* Admin quick-edit */}
        {isAdmin && (
          <div className="mb-4">
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

        {/* Actions */}
        <div className="mb-4 border-t pt-3 px-3 md:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button aria-pressed={liked} onClick={() => { handleLike({ optimistic: true, showAnimation: !liked }); setShowHeart(true); setTimeout(()=>setShowHeart(false),800); }} className="flex items-center gap-2 rounded-full p-2 hover:bg-gray-100 transition">
                <Heart className={`h-5 w-5 transition-transform duration-200 ${liked ? 'text-rose-600 scale-125 animate-pulse' : 'text-gray-700'}`} />
                <span className={`text-sm font-medium transition-transform duration-200 ${liked ? 'scale-110' : ''}`}>{likes}</span>
              </button>

              <button onClick={handleShare} className="flex items-center gap-2 rounded-full p-2 hover:bg-gray-100 transition">
                <Share2 className={`h-5 w-5 ${shareAnimating ? 'text-emerald-600 animate-pulse' : 'text-gray-700'}`} />
                <span className="text-sm">{shares}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost">Comment</Button>
              {isAdmin && <Button size="sm" variant="outline">Edit</Button>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Image Modal */}
    {modalOpen && modalImage && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        onClick={() => setModalOpen(false)}
      >
        <div className="relative mx-4 max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setModalOpen(false)}
            className="absolute right-0 top-0 z-50 m-2 rounded bg-white/90 p-2 text-sm"
            aria-label="Close image"
          >
            Close
          </button>
          <img src={modalImage} alt="Full image" className="max-h-[90vh] max-w-[90vw] object-contain rounded-md" />
        </div>
      </div>
    )}

    {/* Mobile floating action bar removed per UX request */}
    </>
  );
}

function formatContent(input: string) {
  // If it already contains block-level HTML, assume it's already formatted
  const hasBlockTags = /<(p|div|ul|ol|li|br|h[1-6]|blockquote|iframe)\b[^>]*>/i.test(input);
  if (hasBlockTags) {
    // Always process YouTube and image URLs, even in HTML content
    let processed = input;

// YouTube embeds: render a thumbnail placeholder (data-video-id) and let the client confirm embeddability before inserting iframe
const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/(?:v|e(?:mbed)?)\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
processed = processed.replace(youtubeRegex, (match, videoId) => {
  const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  return `<div class="youtube-embed" data-video-id="${videoId}"><div class="youtube-placeholder w-full aspect-video bg-gray-100 rounded-md overflow-hidden"><a href="https://youtu.be/${videoId}" target="_blank" rel="noopener noreferrer" class="block w-full h-full relative"><img src="${thumb}" alt="YouTube thumbnail" class="w-full h-full object-cover" /><span class="absolute inset-0 flex items-center justify-center text-white text-3xl">▶</span></a></div></div>`;
});

    // Image embeds
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico)(?:\?[^\s]*)?|\/uploads\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico)(?:\?[^\s]*)?)/gi;
    processed = processed.replace(imageRegex, (match) => {
      return `<div class="inline-image"><img src="${match}" alt="Embedded image" class="max-w-full h-auto rounded-md cursor-pointer hover:opacity-80 transition-opacity" onclick="window.openImageModal('${match.replace(/'/g, '\\\'')}')" /></div>`;
    });

    return processed;
  }

  // Normalize line endings and trim
  const text = input.replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  // Allowed inline tags we want to preserve
  const allowedTagRegex = /<\/?(?:a|strong|b|em|i|u|code)\b[^>]*>/gi;

  const paragraphs = text.split(/\n\n+/g).map((p) => {
    // Extract allowed inline tags and replace them with placeholders
    const placeholders: string[] = [];
    const extracted = p.replace(allowedTagRegex, (match) => {
      const key = `__HTML_TAG_${placeholders.length}__`;
      placeholders.push(match);
      return key;
    });

    // Check for YouTube URLs and convert them to embeds
    let processed = extracted;
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
    processed = processed.replace(youtubeRegex, (match, videoId) => {
      return `__YOUTUBE_EMBED_${videoId}__`;
    });

    // Check for image URLs and convert them to img tags
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico)(?:\?[^\s]*)?|\/uploads\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico)(?:\?[^\s]*)?)/gi;
    processed = processed.replace(imageRegex, (match) => {
      return `__IMAGE_EMBED_${btoa(match)}__`;
    });

    // Escape the remaining text
    const escaped = escapeHtml(processed);

    // Restore placeholders (original allowed tags)
    let restored = escaped;
    placeholders.forEach((orig, idx) => {
      const key = `__HTML_TAG_${idx}__`;
      restored = restored.replace(key, orig);
    });

    // Convert YouTube placeholders to thumbnail placeholders that the client will swap with an iframe if embeddable
    restored = restored.replace(/__YOUTUBE_EMBED_([a-zA-Z0-9_-]{11})__/g, (match, videoId) => {
      const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      return `<div class="youtube-embed" data-video-id="${videoId}"><div class="youtube-placeholder w-full aspect-video bg-gray-100 rounded-md overflow-hidden"><a href="https://youtu.be/${videoId}" target="_blank" rel="noopener noreferrer" class="block w-full h-full relative"><img src="${thumb}" alt="YouTube thumbnail" class="w-full h-full object-cover" /><span class="absolute inset-0 flex items-center justify-center text-white text-3xl">▶</span></a></div></div>`;
    });

    // Convert image placeholders to img tags
    restored = restored.replace(/__IMAGE_EMBED_([^_]+)__/g, (match, encodedUrl) => {
      const imageUrl = atob(encodedUrl);
      return `<div class="inline-image"><img src="${imageUrl}" alt="Embedded image" class="max-w-full h-auto rounded-md cursor-pointer hover:opacity-80 transition-opacity" onclick="window.openImageModal('${imageUrl.replace(/'/g, '\\\'')}')" /></div>`;
    });

    // Replace single newlines with <br /> inside a paragraph
    const withBreaks = restored.replace(/\n/g, "<br />");
    return `<p>${withBreaks}</p>`;
  });

  return paragraphs.join("\n");
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

