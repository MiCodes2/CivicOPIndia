"use client";

import { useEffect, useState, useRef } from 'react';

export default function ImageLightbox({ images, index, onClose, onPrev, onNext }: { images: string[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void; }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Only handle left/right when there are multiple images
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && (!images || images.length <= 1)) return;
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext, images]);

  if (!images || images.length === 0) return null;
  const src = images[index] || images[0];

  // Try to prefer a likely original/untransformed image when possible by stripping common resize/transform params
  const getOriginalUrl = (u: string) => {
    if (!u) return u;
    if (u.startsWith('data:')) return u; // data URLs cannot be improved
    try {
      const url = new URL(u, window.location.origin);

      // Remove common query params used for resizing/cropping on CDNs
      ['w', 'width', 'h', 'height', 'fit', 'crop', 'f', 'q', 'quality', 's', 'auto'].forEach(p => url.searchParams.delete(p));

      // Cloudinary-like transformations in path: /upload/c_fill,w_200,h_200/ -> remove the c_... segment
      url.pathname = url.pathname.replace(/\/upload\/c_[^/]+(,[^/]+)*\//, '/upload/');

      // Supabase/Imgix style preview segments: remove /-/preview/... if present
      url.pathname = url.pathname.replace(/\/\-\/preview\//, '/');

      return url.toString();
    } catch (e) {
      return u;
    }
  };

  const fullSrc = getOriginalUrl(src);
  const [useIframe, setUseIframe] = useState<boolean>(true);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);

  // build a small srcdoc to render the image centered and scale to its natural size
  const iframeDoc = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1" /><style>html,body{height:100%;margin:0;background:#fff;display:flex;align-items:center;justify-content:center}img{display:block;max-width:100%;max-height:100%;margin:0 auto;object-fit:contain}</style></head><body><img id="_img" src="${fullSrc}" alt="image" onload="(function(){var i=document.getElementById('_img');window.parent.postMessage({type:'iframe-image-loaded',w:i.naturalWidth,h:i.naturalHeight},'*')})()" onerror="window.parent.postMessage({type:'iframe-image-error'},'*')"/></body></html>`;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // auto-fallback: if iframe image doesn't load within 1.5s, switch to image view
  useEffect(()=>{
    if (!useIframe) return;
    let t: any = setTimeout(()=>{ if (!iframeLoaded) setUseIframe(false); }, 1500);
    const onMsg = (e: MessageEvent) => {
      if (e?.data?.type === 'iframe-image-loaded') {
        setIframeLoaded(true);
        // compute desired iframe size based on reported natural size and available viewport wrapper
        const w = Number(e.data.w || 0);
        const h = Number(e.data.h || 0);
        if (w > 0 && h > 0) {
          // Target width: 75% of window width (but not more than 1200px)
          const targetW = Math.min(window.innerWidth * 0.75, 1200);
          const maxH = window.innerHeight * 0.9;

          // Compute size preserving aspect ratio and fitting within targetW x maxH
          let width = Math.round(targetW);
          let height = Math.round((targetW * h) / w);
          if (height > maxH) {
            height = Math.round(maxH);
            width = Math.round((maxH * w) / h);
          }

          // Apply sizes
          if (iframeRef.current) {
            iframeRef.current.style.width = `${width}px`;
            iframeRef.current.style.height = `${height}px`;
            iframeRef.current.style.maxWidth = `${targetW}px`;
            iframeRef.current.style.maxHeight = `${Math.round(maxH)}px`;
          }
        }
      }
      if (e?.data?.type === 'iframe-image-error') setUseIframe(false);
    };
    window.addEventListener('message', onMsg);
    return () => { clearTimeout(t); window.removeEventListener('message', onMsg); };
  }, [useIframe, iframeLoaded]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true">
      {images && images.length > 1 && (
        <button onClick={onPrev} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2">◀</button>
      )}

      <div className="relative mx-4 max-h-[90vh] max-w-[95vw] flex items-center justify-center">
        {/* close button placed near the image (inside the container) */}
        <div className="absolute top-2 right-2 z-50">
          <button onClick={onClose} aria-label="Close" className="text-white bg-black/60 rounded-full p-2">✕</button>
        </div>

        <div className="w-full h-full flex items-center justify-center">
          {useIframe ? (
            <iframe
              ref={iframeRef}
              title={`Image ${index + 1}`}
              srcDoc={iframeDoc}
              className="w-full rounded shadow-lg bg-white"
              style={{ border: 'none', height: 'auto', maxHeight: '90vh' }}
            />
          ) : (
            <img src={fullSrc} alt={`Image ${index+1}`} className="max-w-full max-h-full object-contain rounded shadow-lg bg-white" />
          )}
        </div>


      </div>

      {images && images.length > 1 && (
        <button onClick={onNext} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2">▶</button>
      )}
    </div>
  );
}
