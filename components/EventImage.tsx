"use client";

import { useState } from 'react';
import ImageLightbox from '@/components/admin/ImageLightbox';

export default function EventImage({ images, alt }: { images: string[]; alt?: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const src = images && images.length ? images[0] : null;
  if (!src) return null;

  return (
    <div className="mt-4 mb-6">
      <div className="w-full h-[50vh] sm:h-[60vh] overflow-hidden rounded-md">
        <button
          onClick={() => setOpen(true)}
          aria-label={alt || 'Open image'}
          className="w-full h-full block focus:outline-none"
        >
          <img
            src={src}
            alt={alt || ''}
            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105 hover:shadow-lg active:scale-100 focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          />
        </button>
      </div>

      {open && (
        <ImageLightbox
          images={images}
          index={index}
          onClose={() => setOpen(false)}
          onPrev={() => setIndex((i) => Math.max(0, i - 1))}
          onNext={() => setIndex((i) => Math.min(images.length - 1, i + 1))}
        />
      )}
    </div>
  );
}
