import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Return empty sitemap during maintenance — prevents Google from crawling internal pages
  if (MAINTENANCE_MODE) {
    return []
  }

  const baseUrl = 'https://civicopindia.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/activities`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/citizens-issue`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/donate`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Dynamic event pages
  let eventPages: MetadataRoute.Sitemap = []
  try {
    const supabase = await createClient()
    const { data: events } = await supabase
      .from('events')
      .select('id, updated_at')
      .eq('published', true)
      .order('updated_at', { ascending: false })
      .limit(100) // Limit to recent events

    if (events) {
      eventPages = events.map((event) => ({
        url: `${baseUrl}/events/${event.id}`,
        lastModified: new Date(event.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Error fetching events for sitemap:', error)
  }

  // Dynamic activity type pages
  let activityTypePages: MetadataRoute.Sitemap = []
  try {
    const supabase = await createClient()
    const { data: types } = await supabase
      .from('activity_types')
      .select('name')

    if (types) {
      activityTypePages = types.map((type) => ({
        url: `${baseUrl}/activities?type=${encodeURIComponent(type.name)}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Error fetching activity types for sitemap:', error)
  }

  return [...staticPages, ...eventPages, ...activityTypePages]
}