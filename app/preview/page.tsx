"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatContent } from '@/lib/formatContent';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Calendar, MapPin } from 'lucide-react';

function PreviewContent() {
  const searchParams = useSearchParams();
  const [previewData, setPreviewData] = useState<{
    title: string;
    content: string;
    location?: string;
    activityDate?: string;
    activityType?: string;
    imageUrls?: string[];
  } | null>(null);

  useEffect(() => {
    // Try to get data from URL params first
    const urlData = searchParams.get('data');
    if (urlData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(urlData));
        setPreviewData(decoded);
        return;
      } catch (e) {
        console.error('Failed to parse URL data:', e);
      }
    }

    // Otherwise try sessionStorage
    const storedData = sessionStorage.getItem('preview_data');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setPreviewData(parsed);
      } catch (e) {
        console.error('Failed to parse preview data:', e);
      }
    }
  }, [searchParams]);

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

  if (!previewData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No preview data available</p>
      </div>
    );
  }

  const formattedContent = formatContent(previewData.content || '');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              {previewData.activityType && (
                <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-md mr-2 font-medium">
                  {previewData.activityType}
                </div>
              )}
              {previewData.activityDate && (
                <div className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(previewData.activityDate)}
                </div>
              )}
              {previewData.location && (
                <div className="inline-flex items-center gap-1 ml-3">
                  <MapPin className="h-4 w-4" />
                  {previewData.location}
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold mt-4">
              {previewData.title || 'Untitled Post'}
            </h1>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Images */}
            {previewData.imageUrls && previewData.imageUrls.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {previewData.imageUrls.map((url, idx) => (
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

            {/* Content */}
            <div 
              className="prose prose-sm md:prose-base max-w-none"
              style={{ whiteSpace: 'pre-line' }}
              dangerouslySetInnerHTML={{ 
                __html: formattedContent || '<p class="text-muted-foreground italic">No content</p>' 
              }}
            />
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>This is a preview of how your post will appear</p>
        </div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading preview...</p>
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}
