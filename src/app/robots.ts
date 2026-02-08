import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/auth/', '/o/'],
      },
    ],
    sitemap: 'https://proofound.io/sitemap.xml',
  };
}
