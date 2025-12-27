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
    let s = el.value;
    // decode numeric entities remaining after DOM decode
    s = s.replace(/&#(\d+);/g, (m, code) => String.fromCharCode(parseInt(code, 10)));
    s = s.replace(/&#x([0-9a-fA-F]+);/g, (m, code) => String.fromCharCode(parseInt(code, 16)));
    s = s.replace(/&apos;/g, "'").replace(/&#039;/g, "'");
    return s;
  }
  // Server-side fallback: decode common named entities and numeric entities
  let decoded = String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");
  // numeric entities (decimal and hex)
  decoded = decoded.replace(/&#(\d+);/g, (m, code) => String.fromCharCode(parseInt(code, 10)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (m, code) => String.fromCharCode(parseInt(code, 16)));
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

export function normalizeEntities(str: string) {
  if (!str) return '';
  let prev = String(str);
  for (let i = 0; i < 4; i++) {
    const dec = decodeHtmlEntities(prev);
    if (dec === prev) break;
    prev = dec;
  }
  return prev;
}

export function strictClean(str: string) {
  // Built on normalizeEntities but performs aggressive cleaning of common broken encodings
  if (!str) return '';
  let s = normalizeEntities(String(str));

  // Fix common double-encoded numeric entities and variants (e.g., &amp;#039;, &#039;, & #039;)
  s = s.replace(/&amp;#\s*0*39;|&\s*#\s*0*39;|&#x27;/gi, "'");

  // decode any remaining numeric/hex sequences spelled oddly
  s = s.replace(/&amp;#\s*(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
  s = s.replace(/&amp;#x\s*([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

  // Remove invisible / zero-width characters and stray control characters
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Normalize whitespace and remove excessive escaping
  s = s.replace(/\\+'/g, "'");
  s = s.replace(/\s+/g, ' ').trim();

  // Normalize curly quotes to straight quotes to avoid inconsistent rendering
  s = s.replace(/[‘’‚‛]/g, "'");
  s = s.replace(/[“”„‟]/g, '"');

  return s;
}

export function formatContent(input: string, exclude?: string[]) {
  // First, decode HTML entities (handles cases like &amp;#039; or &#039;) so they render as characters
  try {
    input = normalizeEntities(input || '');
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

    // Google Drive video embeds
    const driveRegex = /https?:\/\/(?:www\.)?drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/(?:view|preview)(?:\?[^&\s]*usp=sharing)?/gi;
    processed = processed.replace(driveRegex, (match, fileId) => {
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      return `<div class="drive-video-embed w-full aspect-video bg-gray-100 rounded-md overflow-hidden"><iframe src="${embedUrl}" width="100%" height="100%" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
    });

    // Twitter/X video embeds
    const twitterRegex = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/([0-9]+)(?:\/[^&\s]*)?/gi;
    processed = processed.replace(twitterRegex, (match, username, tweetId) => {
      const embedUrl = `https://platform.x.com/embed/Tweet.html?id=${tweetId}`;
      return `<div class="twitter-video-embed w-full bg-gray-100 rounded-md overflow-hidden flex justify-center"><iframe src="${embedUrl}" width="100%" height="400" frameborder="0" scrolling="no" allowfullscreen class="w-full min-h-[400px] max-w-2xl"></iframe></div>`;
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

    // Google Drive video embeds
    const driveRegex = /https?:\/\/(?:www\.)?drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/(?:view|preview)(?:\?[^&\s]*usp=sharing)?/gi;
    processed = processed.replace(driveRegex, (match, fileId) => {
      return `__DRIVE_VIDEO_EMBED_${fileId}__`;
    });

    // Twitter/X video embeds
    const twitterRegex = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/([0-9]+)(?:\/[^&\s]*)?/gi;
    processed = processed.replace(twitterRegex, (match, username, tweetId) => {
      return `__TWITTER_VIDEO_EMBED_${tweetId}__`;
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

    // Restore Google Drive video embeds
    restored = restored.replace(/__DRIVE_VIDEO_EMBED_([a-zA-Z0-9_-]+)__/g, (m, fileId) => {
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      return `<div class="drive-video-embed w-full aspect-video bg-gray-100 rounded-md overflow-hidden"><iframe src="${embedUrl}" width="100%" height="100%" allow="autoplay" allowfullscreen></iframe></div>`;
    });

    // Restore Twitter/X video embeds
    restored = restored.replace(/__TWITTER_VIDEO_EMBED_([0-9]+)__/g, (m, tweetId) => {
      const embedUrl = `https://platform.x.com/embed/Tweet.html?id=${tweetId}`;
      return `<div class="twitter-video-embed w-full bg-gray-100 rounded-md overflow-hidden flex justify-center"><iframe src="${embedUrl}" width="100%" height="400" frameborder="0" scrolling="no" allowfullscreen class="w-full min-h-[400px] max-w-2xl"></iframe></div>`;
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

  let out = paragraphs.join("\n");
  // Ensure raw ampersands immediately followed by an anchor are escaped consistently to avoid SSR hydration mismatches
  out = out.replace(/&(?!#?\w+;)(?=<a\s)/g, '&amp;');
  return out;
}
