"use client";

import { useState } from 'react';

export default function DebugUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [resp, setResp] = useState<any>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResp(null);
    setStatus(null);
    if (!file) {
      setResp({ error: 'No file selected' });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      // Send as 'file' by default
      fd.append('file', file);

      // Also send under common alternate names for debugging
      // (commented: to try variations, uncomment below lines in the browser console)
      // fd.append('image', file);
      // fd.append('files[]', file);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const txt = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(txt); } catch { parsed = txt; }
      setStatus(res.status);
      setResp(parsed);
    } catch (e:any) {
      setResp({ error: String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Debug Page</h1>
      <p className="mb-4 text-sm text-muted-foreground">Use this page on your phone to upload an image and see the exact HTTP status and response body from <code>/api/upload</code>.</p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
        </div>
        <div>
          <button className="px-4 py-2 bg-primary text-white rounded" disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
        </div>
      </form>

      <div className="mt-6">
        <div className="font-medium">Status: {status ?? '-'}</div>
        <div className="mt-2">
          <pre className="rounded-md bg-surface p-3 overflow-auto">{JSON.stringify(resp, null, 2)}</pre>
        </div>
      </div>

      <div className="mt-6 text-sm text-muted-foreground">
        <p>You can also open the browser console on your phone and try alternate form keys by building your own FormData in console and posting to <code>/api/upload</code>.</p>
      </div>
    </div>
  );
}
