// Lightweight list of site pages to include in the old-style site search.
// Keep this small — these pages are limited and static in nature.
export const SEARCH_PAGES: { path: string; selectors?: string[]; titleSelector?: string }[] = [
  { path: '/', selectors: ['main', 'article', '.prose', 'p', 'h1,h2,h3'], titleSelector: 'h1' },
  { path: '/donate', selectors: ['main', 'article', '.prose', 'p', 'h1,h2,h3'], titleSelector: 'h1' },
  { path: '/team/arif-mudgal', selectors: ['main', 'article', '.prose', 'p', 'h1,h2,h3'], titleSelector: 'h1' },
  { path: '/team/capt-santhosh', selectors: ['main', 'article', '.prose', 'p', 'h1,h2,h3'], titleSelector: 'h1' },
  { path: '/team/dr-ansiha', selectors: ['main', 'article', '.prose', 'p', 'h1,h2,h3'], titleSelector: 'h1' },
  { path: '/team/mithilesh-kumar', selectors: ['main', 'article', '.prose', 'p', 'h1,h2,h3'], titleSelector: 'h1' },
  { path: '/partners/baf', selectors: ['main', 'article', '.prose', 'p', 'h1,h2,h3'], titleSelector: 'h1' },
  { path: '/partners/blrpost', selectors: ['main', 'article', '.prose', 'p', 'h1,h2,h3'], titleSelector: 'h1' },
  { path: '/partners/citizen-matters', selectors: ['main', 'article', '.prose', 'p', 'h1,h2,h3'], titleSelector: 'h1' },
  { path: '/partners/namma-bengaluru', selectors: ['main', 'article', '.prose', 'p', 'h1,h2,h3'], titleSelector: 'h1' },
  { path: '/partners/whitefield-rising', selectors: ['main', 'article', '.prose', 'p', 'h1,h2,h3'], titleSelector: 'h1' },
  { path: '/partners/wri-india', selectors: ['main', 'article', '.prose', 'p', 'h1,h2,h3'], titleSelector: 'h1' },
]
