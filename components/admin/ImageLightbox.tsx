"use client";

import { useEffect } from 'react';

export default function ImageLightbox({ images, index, onClose, onPrev, onNext }: { images: string[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void; }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  if (!images || images.length === 0) return null;
  const src = images[index] || images[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true">
      <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2">✕</button>
      <button onClick={onPrev} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2">◀</button>
      <div className="max-w-[95vw] max-h-[90vh] flex items-center justify-center">
        <img src={src} alt={`Image ${index+1}`} className="max-w-full max-h-full object-contain rounded shadow-lg" />
      </div>
      <button onClick={onNext} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2">▶</button>
    </div>
  );
}
