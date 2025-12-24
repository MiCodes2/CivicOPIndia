"use client";

import { useState, useEffect, useRef } from "react";
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
  'Press Conference': 'bg-amber-600',
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
    setModalImage(imageUrl);
    setModalOpen(true);
  };

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
    <Card className="mx-auto w-full max-w-4xl overflow-hidden transition-shadow hover:shadow-lg mb-6">
      <CardContent className="p-6 relative">
        {/* Type badge */}
        {localType && (
          <div className="absolute right-4 top-4 z-10">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium text-white shadow transition-colors duration-300 transform hover:scale-105 ${badgeColorForType(localType)}`}>
              {localType}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">{(activity.author_name||'').split(' ').map(s=>s[0]||'').slice(0,2).join('').toUpperCase()}</div>
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
          <div className="mb-6 flex justify-center">
            <div className="w-full flex justify-center">
              <div className="w-full md:w-2/5 rounded-lg overflow-hidden shadow-lg">
                <div className="relative">
                  <img
                    src={images[0]}
                    alt="Featured"
                    className="w-full h-auto object-cover cursor-pointer"
                    onClick={(e) => {
                      // Prevent opening modal if this click is part of a double-tap
                      if (doubleTapRef.current) {
                        doubleTapRef.current = false;
                        return;
                      }
                      // small delay to allow double click detection
                      setTimeout(() => {
                        if (!doubleTapRef.current) {
                          setModalImage(images[0]);
                          setModalOpen(true);
                        }
                      }, 200);
                    }}
                    onDoubleClick={() => {
                      doubleTapRef.current = true;
                      handleLike({ optimistic: true, showAnimation: true });
                    }}
                    onTouchStart={() => {
                      const now = Date.now();
                      if (touchLastTap.current && (now - touchLastTap.current) < 300) {
                        // double tap
                        touchLastTap.current = null;
                        doubleTapRef.current = true;
                        handleLike({ optimistic: true, showAnimation: true });
                      } else {
                        touchLastTap.current = now;
                      }
                    }}
                  />
                  {showHeart && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="animate-ping-slow text-6xl text-emerald-500 drop-shadow-lg" style={{ textShadow: '0 0 12px rgba(255,255,255,0.95), 0 0 24px rgba(255,255,255,0.6)', WebkitTextStroke: '1px rgba(255,255,255,0.9)' }}>❤</div>
                    </div>
                  )}
                </div>
                {activity.image_captions && activity.image_captions[0] && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-muted-foreground">{activity.image_captions[0]}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Post content */}
        <div
          className="mb-4 text-muted-foreground prose prose-sm max-w-none"
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
        {images && images.length > 1 && (
          <div className="mb-4 flex justify-center">
            <div className="flex gap-3 overflow-x-auto px-2">
              {images.slice(1).map((url, idx) => (
                <div key={idx} className="flex-shrink-0 w-36">
                  <button
                    className="h-24 w-full overflow-hidden rounded-md bg-muted"
                    onClick={() => {
                      setModalImage(url);
                      setModalOpen(true);
                    }}
                    aria-label={`Open image ${idx + 2}`}
                  >
                    <img src={url} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                  {activity.image_captions && activity.image_captions[idx + 1] && (
                    <p className="mt-2 text-xs text-center text-muted-foreground">
                      {activity.image_captions[idx + 1]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="mb-4 space-y-2 text-sm text-muted-foreground">
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
        <div className="flex items-center gap-4 border-t pt-4 justify-between">
          <Button
            variant={liked ? "default" : "outline"}
            size="sm"
            onClick={() => handleLike({ optimistic: true, showAnimation: !liked })}
            className={`flex items-center gap-2 ${liked ? 'bg-emerald-100 border border-emerald-200 rounded-md px-2' : ''}`}
            aria-pressed={liked}
          >
            <Heart className={`h-4 w-4 transition-transform duration-200 ${liked ? 'bg-emerald-600 text-white p-1 rounded-full scale-110 animate-pulse ring-2 ring-white/80 shadow-sm' : ''}`} />
            <span className="text-black font-medium">{likes}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span>{shares}</span>
          </Button>
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

