"use client";

import { useState } from "react";
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

  const handleLike = () => {
    if (liked) {
      setLikes(likes - 1);
      setLiked(false);
    } else {
      setLikes(likes + 1);
      setLiked(true);
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
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      {/* Image if available */}
      {activity.image_url && !imageError && (
        <div className="relative h-64 w-full overflow-hidden bg-muted">
          <Image
            src={activity.image_url}
            alt={activity.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
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
        <p className="mb-4 text-muted-foreground">{activity.content}</p>

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
  );
}
