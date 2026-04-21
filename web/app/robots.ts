import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/dashboard',
          '/profile',
          '/bookmarks',
          '/badges',
          '/payment/',
          '/auth/',
        ],
      },
      {
        // Block AI scrapers from indexing content
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: 'https://zimmaths.com/sitemap.xml',
    host: 'https://zimmaths.com',
  }
}
