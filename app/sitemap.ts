import type { MetadataRoute } from 'next'
import { getAllPosts } from '../lib/posts'
import { SITE_URL } from '../lib/constants'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map((post) => ({
    url: `${SITE_URL}/writing/${post.id}`,
    lastModified: new Date(post.date),
  }))

  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/writing`, priority: 0.8 },
    { url: `${SITE_URL}/research`, priority: 0.8 },
    ...posts,
  ]
}
