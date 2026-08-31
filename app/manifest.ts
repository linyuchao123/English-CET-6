import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '六级词伴', short_name: '六级词伴', description: '每天 30 个英语六级词汇',
    start_url: '/', display: 'standalone', background_color: '#f5f1e8', theme_color: '#23533c',
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
