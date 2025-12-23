"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Calendar, MapPin } from "lucide-react";
import Image from "next/image";
import type { Activity } from "@/lib/types/database";

interface ActivityFeedCardProps {
  activity: Activity;
}

export default function ActivityFeedCard({ activity }: ActivityFeedCardProps) {
  const [likes, setLikes] = useState(activity.likes_count);
  const [shares, setShares] = useState(activity.shares_count);
  const [liked, setLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user already liked this activity
  useEffect(() => {
    checkLikeStatus();
  }, [activity.id]);

  const checkLikeStatus = async () => {
    try {
      const response = await fetch(`/api/like?activityId=${activity.id}`);
      const data = await response.json();
      setLiked(data.liked);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: activity.id }),
      });

      const data = await response.json();
      
      if (data.liked) {
        setLikes((s) => s + 1);
        setLiked(true);
      } else {
        setLikes((s) => Math.max(0, s - 1));
        setLiked(false);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
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
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      {/* Image if available */}
      {activity.image_url && !imageError && (
        <div className="relative h-48 w-full overflow-hidden bg-muted rounded-md">
          <Image
            src={activity.image_url}
            alt={activity.title}
            fill
            className="object-cover cursor-pointer"
            onError={() => setImageError(true)}
            onClick={() => {
              setModalImage(activity.image_url || null);
              setModalOpen(true);
            }}
          />
        </div>
      )}

      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            {activity.type && (
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {activity.type}
              </span>
            )}
          </div>
          <h3 className="mt-2 text-2xl font-bold">{activity.title}</h3>
          {activity.author_name && (
            <p className="mt-1 text-sm text-muted-foreground">
              Posted by <span className="font-medium text-primary">{activity.author_name}</span>
            </p>
          )}
        </div>

        {/* Content */}
        <div
          className="mb-4 text-muted-foreground prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: formatContent(activity.content || '') }}
        />

        {/* Metadata */}
        <div className="mb-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(activity.activity_date).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          {activity.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{activity.location}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 border-t pt-4">
          <Button
            variant={liked ? "default" : "outline"}
            size="sm"
            onClick={handleLike}
            className="flex items-center gap-2"
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
            <span>{likes}</span>
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
  const hasBlockTags = /<(p|div|ul|ol|li|br|h[1-6]|blockquote)\b[^>]*>/i.test(input);
  if (hasBlockTags) return input;

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

    // Escape the remaining text
    const escaped = escapeHtml(extracted);

    // Restore placeholders (original allowed tags)
    let restored = escaped;
    placeholders.forEach((orig, idx) => {
      const key = `__HTML_TAG_${idx}__`;
      restored = restored.replace(key, orig);
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

