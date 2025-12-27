export function escapeHtml(unsafe: string) {
  // Don't double-escape existing HTML entities like &#039; or &amp; — only escape raw ampersands
  if (!unsafe) return '';
  return unsafe
    // Replace ampersands that are NOT part of an existing entity (e.g., &#039; or &nbsp;)
    .replace(/&(?!#?\w+;)/g, '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function decodeHtmlEntities(str: string) {
  if (!str) return '';
  // Client-side: use DOM parsing to decode entities
  if (typeof document !== 'undefined') {
    const el = document.createElement('textarea');
    el.innerHTML = str;
    return el.value;
  }
  // Server-side fallback: decode common named entities and numeric entities
  let decoded = String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  // numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (m, code) => String.fromCharCode(parseInt(code, 10)));
  return decoded;
}

const base64Encode = (s: string) => {
  if (typeof (globalThis as any).btoa === 'function') return (globalThis as any).btoa(s);
  return Buffer.from(s, 'utf8').toString('base64');
};
const base64Decode = (s: string) => {
  if (typeof (globalThis as any).atob === 'function') return (globalThis as any).atob(s);
  return Buffer.from(s, 'base64').toString('utf8');
};

export function formatContent(input: string, exclude?: string[]) {
  // First, decode HTML entities (handles cases like &amp;#039; or &#039;) so they render as characters
  try {
    input = decodeHtmlEntities(input || '');
  } catch (e) {
    // ignore and continue with original input
    input = input || '';
  }

  function linkifyHashtags(html: string) {
    return html.replace(/(^|[^A-Za-z0-9_\/\-])#([a-zA-Z0-9_-]+)/g, (match, pre, tag) => {
      const t = String(tag).toLowerCase();
      return `${pre}<a href="/activities?tag=${encodeURIComponent(t)}" class="text-primary font-medium no-underline">#${tag}</a>`;
    });
  }

  // If it already contains block-level HTML, assume it's already formatted
  const hasBlockTags = /<(p|div|ul|ol|li|br|h[1-6]|blockquote|iframe)\b[^>]*>/i.test(input);
  if (hasBlockTags) {
    let processed = input;

    // YouTube embeds
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/(?:v|e(?:mbed)?)\/(?:v|e(?:mbed)?)\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
    processed = processed.replace(youtubeRegex, (match, videoId) => {
      const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      return `<div class="youtube-embed" data-video-id="${videoId}"><div class="youtube-placeholder w-full aspect-video bg-gray-100 rounded-md overflow-hidden"><a href="https://youtu.be/${videoId}" target="_blank" rel="noopener noreferrer" class="block w-full h-full relative"><img src="${thumb}" alt="YouTube thumbnail" class="w-full h-full object-cover" /><span class="absolute inset-0 flex items-center justify-center text-white text-3xl">▶</span></a></div></div>`;
    });

    // Image embeds (include jfif)
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico|jfif)(?:\?[^\s]*)?|\/uploads\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico|jfif)(?:\?[^\s]*)?)/gi;
    const excludeSet = new Set(exclude || []);
    processed = processed.replace(imageRegex, (match) => {
      if (excludeSet.has(match)) return '';
      return `<div class="inline-image"><img src="${match}" alt="Embedded image" class="max-w-full h-auto rounded-md cursor-pointer hover:opacity-80 transition-opacity" onclick="window.openImageModal('${match.replace(/'/g, "\\'")}')" /></div>`;
    });

    processed = linkifyHashtags(processed);
    return processed;
  }

  const text = input.replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  const allowedTagRegex = /<\/?(?:a|strong|b|em|i|u|code)\b[^>]*>/gi;

  const paragraphs = text.split(/\n\n+/g).map((p) => {
    const placeholders: string[] = [];
    const extracted = p.replace(allowedTagRegex, (match) => {
      const key = `__HTML_TAG_${placeholders.length}__`;
      placeholders.push(match);
      return key;
    });

    let processed = extracted;

    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/(?:v|e(?:mbed)?)\/(?:v|e(?:mbed)?)\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
    processed = processed.replace(youtubeRegex, (match, videoId) => {
      return `__YOUTUBE_EMBED_${videoId}__`;
    });

    // Check for image URLs and convert them to placeholders
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico|jfif)(?:\?[^\s]*)?|\/uploads\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico|jfif)(?:\?[^\s]*)?)/gi;
    processed = processed.replace(imageRegex, (match) => {
      return `__IMAGE_EMBED_${base64Encode(match)}__`;
    });

    const escaped = escapeHtml(processed);

    let restored = escaped;
    placeholders.forEach((orig, idx) => {
      const key = `__HTML_TAG_${idx}__`;
      restored = restored.replace(key, orig);
    });

    restored = linkifyHashtags(restored);

    restored = restored.replace(/__YOUTUBE_EMBED_([a-zA-Z0-9_-]{11})__/g, (m, videoId) => {
      const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      return `<div class="youtube-embed" data-video-id="${videoId}"><div class="youtube-placeholder w-full aspect-video bg-gray-100 rounded-md overflow-hidden"><a href="https://youtu.be/${videoId}" target="_blank" rel="noopener noreferrer" class="block w-full h-full relative"><img src="${thumb}" alt="YouTube thumbnail" class="w-full h-full object-cover" /><span class="absolute inset-0 flex items-center justify-center text-white text-3xl">▶</span></a></div></div>`;
    });

    // Convert image placeholders to img tags (exclude set applied here too)
    const excludeSet = new Set(exclude || []);
    restored = restored.replace(/__IMAGE_EMBED_([^_]+)__/g, (match, encodedUrl) => {
      const imageUrl = base64Decode(encodedUrl);
      if (excludeSet.has(imageUrl)) return '';
      return `<div class="inline-image"><img src="${imageUrl}" alt="Embedded image" class="max-w-full h-auto rounded-md cursor-pointer hover:opacity-80 transition-opacity" onclick="window.openImageModal('${imageUrl.replace(/'/g, "\\'")}')" /></div>`;
    });

    const withBreaks = restored.replace(/\n/g, "<br />");
    return `<p>${withBreaks}</p>`;
  });

  return paragraphs.join("\n");
}
