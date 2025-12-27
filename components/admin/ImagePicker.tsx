"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImagePickerProps {
  max?: number;
  initialFiles?: File[];
  initialPreviews?: string[];
  initialUrls?: string[];
  initialCaptions?: string[];
  onChange?: (files: File[], previews: string[], urls: string[], captions: string[]) => void;
}

export default function ImagePicker({ max = 4, initialFiles = [], initialPreviews = [], initialUrls = [], initialCaptions = [], onChange, showPreviews = true }: ImagePickerProps & { showPreviews?: boolean }) {
  const [files, setFiles] = useState<File[]>(initialFiles || []);
  const [previews, setPreviews] = useState<string[]>(initialPreviews || []);
  const [urls, setUrls] = useState<string[]>(initialUrls || []);
  const [captions, setCaptions] = useState<string[]>(initialCaptions || []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (onChange) onChange(files, previews, urls, captions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, previews, urls, captions]);

  const readFiles = async (incoming: File[]) => {
    const combined = [...files, ...incoming].slice(0, max);
    const previewsPromises = combined.map((f, i) => {
      // if we already have a preview at this index, keep it
      if (previews[i] && !f.name) return Promise.resolve(previews[i]);
      return new Promise<string>((res) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result as string);
        r.readAsDataURL(f);
      });
    });
    const nextPreviews = await Promise.all(previewsPromises);
    setFiles(combined);
    setPreviews(nextPreviews.slice(0, max));
    setCaptions((c) => {
      const copy = c.slice();
      while (copy.length < combined.length) copy.push('');
      return copy.slice(0, max);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    readFiles(selected);
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dtFiles = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
    if (dtFiles.length) readFiles(dtFiles);
  };

  const addUrl = (u: string) => {
    if (!u) return;
    const trimmed = u.trim();
    const next = [...urls, trimmed].slice(0, max);
    setUrls(next);
    setPreviews((p) => (p.length < max ? [...p, trimmed] : p));
  };

  const removeAt = (idx: number) => {
    setFiles((f) => f.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
    setUrls((u) => u.filter((_, i) => i !== idx));
    setCaptions((c) => c.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: number) => {
    const swap = <T,>(arr: T[]) => {
      const copy = arr.slice();
      const to = idx + dir;
      if (to < 0 || to >= copy.length) return arr;
      const tmp = copy[to];
      copy[to] = copy[idx];
      copy[idx] = tmp;
      return copy;
    };
    setFiles((f) => swap(f));
    setPreviews((p) => swap(p));
    setUrls((u) => swap(u));
    setCaptions((c) => swap(c));
  };

  const setCaption = (idx: number, val: string) => {
    setCaptions((c) => {
      const copy = c.slice();
      copy[idx] = val;
      return copy;
    });
  };

  return (
    <div>
      <div className="mb-2">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-sm">Drag & drop images here, or click to select (max {max})</div>
          <input ref={fileInputRef} type="file" accept="image/*,.jfif" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
        </div>
      </div>

      {showPreviews && (
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap py-1">
          {(previews || []).map((p, idx) => (
            <div key={idx} className="w-24 h-20 flex-shrink-0 relative rounded-md overflow-hidden bg-gray-50">
              <img src={p} alt={`preview-${idx}`} className="w-full h-full object-cover" />
              <div className="absolute top-1 right-1 flex gap-1">
                <button type="button" onClick={() => move(idx, -1)} className="px-1 py-0.5 text-xs rounded bg-gray-100">←</button>
                <button type="button" onClick={() => move(idx, 1)} className="px-1 py-0.5 text-xs rounded bg-gray-100">→</button>
                <button type="button" onClick={() => removeAt(idx)} className="px-1 py-0.5 text-xs rounded bg-red-100">✕</button>
              </div>
              <input
                placeholder="Caption"
                value={captions[idx] || ''}
                onChange={(e) => setCaption(idx, e.target.value)}
                className="absolute left-1 right-1 bottom-1 text-xs rounded bg-white/70 px-1 py-0.5"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Input placeholder="Paste image URL and press Add" onKeyDown={(e:any)=>{ if(e.key==='Enter'){ addUrl(e.target.value); e.target.value=''; } }} />
        <Button type="button" onClick={() => { const el = document.querySelector('input[placeholder="Paste image URL and press Add"]') as HTMLInputElement; if (el && el.value) { addUrl(el.value); el.value=''; } }}>Add</Button>
      </div>
    </div>
  );
}
