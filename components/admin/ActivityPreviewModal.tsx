"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ActivityPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  location?: string;
  activityDate?: string;
  activityType?: string;
  imageUrls?: string[];
  videoUrl?: string;
}

export default function ActivityPreviewModal({
  isOpen,
  onClose,
  title,
  content,
  location,
  activityDate,
  activityType,
  imageUrls = [],
  videoUrl,
}: ActivityPreviewModalProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderVideo = () => {
    if (!videoUrl) return null;

    // YouTube embed
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      let videoId = '';
      if (videoUrl.includes('youtube.com/watch?v=')) {
        videoId = videoUrl.split('v=')[1]?.split('&')[0] || '';
      } else if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
      }
      
      if (videoId) {
        return (
          <div className="aspect-video w-full mb-4">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        );
      }
    }

    // For other video URLs, show link
    return (
      <div className="mb-4 p-3 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">Video:</p>
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all text-sm"
        >
          {videoUrl}
        </a>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Preview</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {activityType && (
              <div className="inline-block px-2 py-1 bg-primary/10 text-primary rounded-md mr-2">
                {activityType}
              </div>
            )}
            {activityDate && (
              <div className="inline-block">
                📅 {formatDate(activityDate)}
              </div>
            )}
            {location && (
              <div className="mt-2">
                📍 {location}
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold">{title || 'Untitled'}</h1>

          {/* Images */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={url}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-auto rounded-lg object-cover"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Video */}
          {renderVideo()}

          {/* Content */}
          <div 
            className="prose prose-sm md:prose-base max-w-none"
            style={{ whiteSpace: 'pre-line' }}
            dangerouslySetInnerHTML={{ __html: content || '<p class="text-muted-foreground italic">No content</p>' }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
