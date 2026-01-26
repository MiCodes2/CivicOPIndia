// Cross-platform entity decoding for consistent server/client behavior
export function decodeEntitiesCrossPlatform(text: string): string {
  if (!text) return '';
  
  if (typeof window !== 'undefined') {
    // Client-side: Use browser's native decoding
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    let decoded = textarea.value;
    // Handle remaining numeric entities
    decoded = decoded.replace(/&#(\d+);/g, (m, code) => String.fromCharCode(parseInt(code, 10)));
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (m, code) => String.fromCharCode(parseInt(code, 16)));
    return decoded;
  }

  // Server-side fallback: decode common named entities and numeric entities
  let decoded = String(text)
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
  if (typeof (globalThis as unknown as Record<string, unknown>).btoa === 'function') return (globalThis as unknown as Record<string, (s: string) => string>).btoa(s);
  return Buffer.from(s, 'utf8').toString('base64');
};
const base64Decode = (s: string) => {
  if (typeof (globalThis as unknown as Record<string, unknown>).atob === 'function') return (globalThis as unknown as Record<string, (s: string) => string>).atob(s);
  return Buffer.from(s, 'base64').toString('utf8');
};

// Enhanced content processing with industry best practices
export function formatContent(input: string, exclude?: string[]) {
  if (!input?.trim()) return '';

  // 1. Decode HTML entities consistently
  let processed = decodeEntitiesCrossPlatform(input);
  
  // Additional double-encoded entity cleanup
  processed = processed.replace(/&amp;#0*39;/gi, "'");
  processed = processed.replace(/&amp;#x0*27;/gi, "'");
  processed = processed.replace(/&amp;apos;/gi, "'");
  processed = processed.replace(/&amp;quot;/gi, '"');
  processed = processed.replace(/&amp;lt;/gi, '<');
  processed = processed.replace(/&amp;gt;/gi, '>');
  processed = processed.replace(/&#0*39;/g, "'");
  processed = processed.replace(/&#x0*27;/gi, "'");
  processed = processed.replace(/&apos;/g, "'");

  // 2. Clean up broken HTML fragments (targeted cleanup - DO NOT remove valid anchor tags)
  processed = cleanupBrokenFragments(processed);

  // Check if content has block-level HTML tags
  const hasBlockTags = /<(p|div|ul|ol|li|br|h[1-6]|blockquote|iframe)\b[^>]*>/i.test(processed);

  if (hasBlockTags) {
    // Process block-level HTML content
    processed = processEmbedsInHtml(processed, exclude);
    processed = linkifyHashtags(processed);
    // Clean up extra whitespace from removed images - more aggressive
    processed = processed.replace(/<p>\s*<\/p>/g, '');
    processed = processed.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>');
    processed = processed.replace(/\n{2,}/g, '\n');
    processed = processed.replace(/\s+$/gm, ''); // Remove trailing whitespace from each line
    return processed.trim();
  }

  // 3. For plain text, process with paragraph structure
  processed = processPlainText(processed, exclude);

  // Final cleanup: remove trailing whitespace and empty elements
  processed = processed.replace(/<p>\s*<\/p>/g, '');
  processed = processed.replace(/\s+$/g, '');
  
  return processed.trim();
}

// Minimal cleanup - only strip extra whitespace, preserve all valid HTML
function cleanupBrokenFragments(content: string): string {
  let cleaned = content;

  // Normalize multiple spaces to single space
  cleaned = cleaned.replace(/  +/g, ' ');

  // Trim trailing whitespace per line
  cleaned = cleaned.replace(/[ \t]+$/gm, '');
  
  // Remove trailing whitespace from entire content
  cleaned = cleaned.trim();

  return cleaned;
}

// Linkify hashtags (only those not already inside anchor tags or CSS/style content)
function linkifyHashtags(text: string): string {
  // Don't process hashtags that look like hex colors (3, 4, 6, or 8 hex digits)
  // or are inside style attributes or CSS content
  return text.replace(/(^|[^A-Za-z0-9_\/\-])#([a-zA-Z][a-zA-Z0-9_-]*)(?![^<]*<\/a>)/g, (match, pre, tag) => {
    // Skip if it looks like a hex color (all hex digits)
    if (/^[0-9a-fA-F]+$/.test(tag)) return match;
    // Skip common CSS-related patterns
    if (/^(fff|000|[0-9a-f]{3,8})$/i.test(tag)) return match;
    const t = String(tag).toLowerCase();
    return `${pre}<a href="/activities?tag=${encodeURIComponent(t)}" class="text-primary font-medium no-underline hover:underline">#${tag}</a>`;
  });
}

// Process embeds within existing HTML content
function processEmbedsInHtml(content: string, exclude?: string[]): string {
  let processed = content;

  // First, handle Twitter/X URLs wrapped in anchor tags - replace entire anchor with embed
  // Pattern: <a href="https://twitter.com/...">...</a> or <a ...>https://twitter.com/...</a>
  const twitterAnchorRegex = /<a\s[^>]*>([^<]*https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/([0-9]+)[^<]*)<\/a>/gi;
  processed = processed.replace(twitterAnchorRegex, (match, text, tweetId) => {
    const embedUrl = `https://platform.x.com/embed/Tweet.html?id=${tweetId}`;
    return `<div class="twitter-video-embed w-full bg-gray-100 rounded-md overflow-hidden flex justify-center py-4"><div class="w-full flex justify-center"><iframe src="${embedUrl}" width="100%" height="600" frameborder="0" scrolling="no" allowfullscreen class="w-full max-w-md md:max-w-lg lg:max-w-2xl border-0" style="min-height: 600px;" loading="lazy"></iframe></div></div>`;
  });

  // Handle YouTube URLs wrapped in anchor tags
  const youtubeAnchorRegex = /<a\s[^>]*>([^<]*(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/(?:v|e(?:mbed)?)\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})[^<]*)<\/a>/gi;
  processed = processed.replace(youtubeAnchorRegex, (match, text, videoId) => {
    const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    return `<div class="youtube-embed" data-video-id="${videoId}"><div class="youtube-placeholder w-full aspect-video bg-gray-100 rounded-md overflow-hidden"><a href="https://youtu.be/${videoId}" target="_blank" rel="noopener noreferrer" class="block w-full h-full relative"><img src="${thumb}" alt="YouTube thumbnail" class="w-full h-full object-cover" /><span class="absolute inset-0 flex items-center justify-center text-white text-3xl">▶</span></a></div></div>`;
  });

  // YouTube embeds (standalone URLs not in anchors)
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/(?:v|e(?:mbed)?)\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
  processed = processed.replace(youtubeRegex, (match, videoId) => {
    const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    return `<div class="youtube-embed" data-video-id="${videoId}"><div class="youtube-placeholder w-full aspect-video bg-gray-100 rounded-md overflow-hidden"><a href="https://youtu.be/${videoId}" target="_blank" rel="noopener noreferrer" class="block w-full h-full relative"><img src="${thumb}" alt="YouTube thumbnail" class="w-full h-full object-cover" /><span class="absolute inset-0 flex items-center justify-center text-white text-3xl">▶</span></a></div></div>`;
  });

  // Google Drive video embeds
  const driveRegex = /https?:\/\/(?:www\.)?drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/(?:view|preview)(?:\?[^&\s]*usp=sharing)?/gi;
  processed = processed.replace(driveRegex, (match, fileId) => {
    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    return `<div class="drive-video-embed w-full aspect-video bg-gray-100 rounded-md overflow-hidden"><iframe src="${embedUrl}" width="100%" height="100%" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
  });

  // Twitter/X embeds (standalone URLs not in anchors) - ALWAYS render actual iframe
  const twitterRegex = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/([0-9]+)(?:\/[^&\s]*)?/gi;
  processed = processed.replace(twitterRegex, (match, username, tweetId) => {
    const embedUrl = `https://platform.x.com/embed/Tweet.html?id=${tweetId}`;
    return `<div class="twitter-video-embed w-full bg-gray-100 rounded-md overflow-hidden flex justify-center py-4"><div class="w-full flex justify-center"><iframe src="${embedUrl}" width="100%" height="600" frameborder="0" scrolling="no" allowfullscreen class="w-full max-w-md md:max-w-lg lg:max-w-2xl border-0" style="min-height: 600px;" loading="lazy"></iframe></div></div>`;
  });

  // Image embeds - including Twitter/X media URLs and URLs with format in query params
  const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico|jfif)(?:\?[^\s]*)?|\/uploads\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico|jfif)(?:\?[^\s]*)?|https?:\/\/pbs\.twimg\.com\/media\/[^\s?]+(?:\?[^\s]*)?|https?:\/\/[^\s]+\?[^\s]*format=(?:jpg|jpeg|png|gif|webp)[^\s]*)/gi;
  const excludeSet = new Set(exclude || []);
  processed = processed.replace(imageRegex, (match) => {
    if (excludeSet.has(match)) return '__REMOVED_IMAGE__';
    return `<div class="inline-image"><img src="${match}" alt="Embedded image" class="max-w-full h-auto rounded-md cursor-pointer hover:opacity-80 transition-opacity" onclick="window.openImageModal('${match.replace(/'/g, "\\'")}')" loading="lazy" /></div>`;
  });

  // Clean up removed images and their surrounding whitespace
  processed = processed.replace(/\s*__REMOVED_IMAGE__\s*/g, ' ');
  processed = processed.replace(/\n+/g, ' '); // Replace all newlines with spaces
  processed = processed.replace(/  +/g, ' '); // Collapse multiple spaces
  processed = processed.trim();

  return processed;
}

// Process plain text content with paragraph structure
function processPlainText(input: string, exclude?: string[]): string {
  const text = input.replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  // Regex to identify allowed inline HTML tags to preserve
  const allowedTagRegex = /<\/?(?:a|strong|b|em|i|u|code)\b[^>]*>/gi;

  const paragraphs = text.split(/\n\n+/g).map((p) => {
    // First, handle anchor-wrapped Twitter/YouTube URLs - replace entire anchor with placeholder
    let preProcessed = p;
    
    // Twitter/X URLs in anchors
    preProcessed = preProcessed.replace(/<a\s[^>]*>[^<]*https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/([0-9]+)[^<]*<\/a>/gi, 
      (match, tweetId) => `__TWITTER_VIDEO_EMBED_${tweetId}__`);
    
    // YouTube URLs in anchors
    preProcessed = preProcessed.replace(/<a\s[^>]*>[^<]*(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/(?:v|e(?:mbed)?)\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})[^<]*<\/a>/gi,
      (match, videoId) => `__YOUTUBE_EMBED_${videoId}__`);

    // Extract and protect remaining allowed HTML tags with placeholders
    const placeholders: string[] = [];
    const extracted = preProcessed.replace(allowedTagRegex, (match) => {
      const key = `__HTML_TAG_${placeholders.length}__`;
      placeholders.push(match);
      return key;
    });

    let processed = extracted;

    // Process embeds and convert to placeholders first
    // YouTube embeds
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/(?:v|e(?:mbed)?)\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
    processed = processed.replace(youtubeRegex, (match, videoId) => {
      return `__YOUTUBE_EMBED_${videoId}__`;
    });

    // Google Drive video embeds
    const driveRegex = /https?:\/\/(?:www\.)?drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/(?:view|preview)(?:\?[^&\s]*usp=sharing)?/gi;
    processed = processed.replace(driveRegex, (match, fileId) => {
      return `__DRIVE_VIDEO_EMBED_${fileId}__`;
    });

    // Twitter/X embeds
    const twitterRegex = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/([0-9]+)(?:\/[^&\s]*)?/gi;
    processed = processed.replace(twitterRegex, (match, username, tweetId) => {
      return `__TWITTER_VIDEO_EMBED_${tweetId}__`;
    });

    // Image embeds - including Twitter/X media URLs and URLs with format in query params
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico|jfif)(?:\?[^\s]*)?|\/uploads\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico|jfif)(?:\?[^\s]*)?|https?:\/\/pbs\.twimg\.com\/media\/[^\s?]+(?:\?[^\s]*)?|https?:\/\/[^\s]+\?[^\s]*format=(?:jpg|jpeg|png|gif|webp)[^\s]*)/gi;
    processed = processed.replace(imageRegex, (match) => {
      return `__IMAGE_EMBED_${base64Encode(match)}__`;
    });

    // Escape HTML special characters in the text (but not the placeholders)
    const escaped = escapeHtml(processed);

    // Restore protected HTML tags
    let restored = escaped;
    placeholders.forEach((orig, idx) => {
      const key = `__HTML_TAG_${idx}__`;
      restored = restored.replace(key, orig);
    });

    // Apply hashtag linkification
    restored = linkifyHashtags(restored);

    // Restore YouTube embed placeholders
    restored = restored.replace(/__YOUTUBE_EMBED_([a-zA-Z0-9_-]{11})__/g, (m, videoId) => {
      const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      return `<div class="youtube-embed" data-video-id="${videoId}"><div class="youtube-placeholder w-full aspect-video bg-gray-100 rounded-md overflow-hidden"><a href="https://youtu.be/${videoId}" target="_blank" rel="noopener noreferrer" class="block w-full h-full relative"><img src="${thumb}" alt="YouTube thumbnail" class="w-full h-full object-cover" /><span class="absolute inset-0 flex items-center justify-center text-white text-3xl">▶</span></a></div></div>`;
    });

    // Restore Google Drive embed placeholders
    restored = restored.replace(/__DRIVE_VIDEO_EMBED_([a-zA-Z0-9_-]+)__/g, (m, fileId) => {
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      return `<div class="drive-video-embed w-full aspect-video bg-gray-100 rounded-md overflow-hidden"><iframe src="${embedUrl}" width="100%" height="100%" allow="autoplay" allowfullscreen loading="lazy"></iframe></div>`;
    });

    // Restore Twitter/X embed placeholders - ALWAYS use actual iframe
    restored = restored.replace(/__TWITTER_VIDEO_EMBED_([0-9]+)__/g, (m, tweetId) => {
      const embedUrl = `https://platform.x.com/embed/Tweet.html?id=${tweetId}`;
      return `<div class="twitter-video-embed w-full bg-gray-100 rounded-md overflow-hidden flex justify-center py-4"><div class="w-full flex justify-center"><iframe src="${embedUrl}" width="100%" height="600" frameborder="0" scrolling="no" allowfullscreen class="w-full max-w-md md:max-w-lg lg:max-w-2xl border-0" style="min-height: 600px;" loading="lazy"></iframe></div></div>`;
    });

    // Restore image embed placeholders
    const excludeSet = new Set(exclude || []);
    restored = restored.replace(/__IMAGE_EMBED_([^_]+)__/g, (match, encodedUrl) => {
      const imageUrl = base64Decode(encodedUrl);
      if (excludeSet.has(imageUrl)) return '__REMOVED_IMAGE__';
      return `<div class="inline-image"><img src="${imageUrl}" alt="Embedded image" class="max-w-full h-auto rounded-md cursor-pointer hover:opacity-80 transition-opacity" onclick="window.openImageModal('${imageUrl.replace(/'/g, "\\'")}')" loading="lazy" /></div>`;
    });

    // Clean up removed images and their surrounding whitespace
    restored = restored.replace(/\s*__REMOVED_IMAGE__\s*/g, ' ');
    restored = restored.replace(/\n+/g, ' '); // Replace all newlines with spaces
    restored = restored.replace(/  +/g, ' '); // Collapse multiple spaces

    // Only convert double+ line breaks to paragraph separators, single breaks stay as spaces
    // This prevents single newlines from appearing as double-spaced
    const withBreaks = restored.replace(/  +/g, ' ').trim();
    if (!withBreaks) return ''; // Return empty string for completely empty content
    return `<p>${withBreaks}</p>`;
  });

  let out = paragraphs.join("\n");
  // Remove empty paragraphs
  out = out.replace(/<p>\s*<\/p>/g, '');
  // Remove multiple consecutive newlines - allow max 1
  out = out.replace(/\n{2,}/g, '\n');
  // Remove excessive breaks - allow max 1
  out = out.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>');
  // Clean up whitespace around block elements
  out = out.replace(/\s*<\/p>\s*<p>\s*/g, '</p><p>');
  out = out.replace(/\s+$/gm, ''); // Remove trailing whitespace from each line
  // Ensure raw ampersands immediately followed by an anchor are escaped consistently
  out = out.replace(/&(?!#?\w+;)(?=<a\s)/g, '&amp;');
  return out.trim();
}

// Legacy functions for backward compatibility
export function escapeHtml(unsafe: string) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&(?!#?\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function decodeHtmlEntities(str: string) {
  return decodeEntitiesCrossPlatform(str);
}

export function normalizeEntities(str: string) {
  if (!str) return '';
  let prev = String(str);
  for (let i = 0; i < 4; i++) {
    const dec = decodeEntitiesCrossPlatform(prev);
    if (dec === prev) break;
    prev = dec;
  }
  return prev;
}

export function strictClean(str: string) {
  if (!str) return '';
  let s = normalizeEntities(String(str));
  // Fix common double-encoded entities
  s = s.replace(/&amp;#\s*0*39;|&\s*#\s*0*39;|&#x27;/gi, "'");
  s = s.replace(/&amp;#\s*(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
  s = s.replace(/&amp;#x\s*([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  // Remove zero-width characters
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');
  // Normalize whitespace
  s = s.replace(/\\+'/g, "'");
  s = s.replace(/\s+/g, ' ').trim();
  // Normalize curly quotes
  s = s.replace(/[''‚‛]/g, "'");
  s = s.replace(/[""„‟]/g, '"');
  return s;
}
