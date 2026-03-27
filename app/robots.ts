import { MetadataRoute } from 'next'

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true'

export default function robots(): MetadataRoute.Robots {
  if (MAINTENANCE_MODE) {
    // Block all crawlers — prevents Google from indexing any internal pages
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  // Normal rules when site is live
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/', '/debug/', '/debug-encoding/', '/test-encoding/', '/preview/'],
      },
    ],
    sitemap: 'https://civicopindia.com/sitemap.xml',
  }
}
