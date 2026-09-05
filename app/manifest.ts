import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '六级词伴', short_name: '六级词伴', description: '每天 60 个英语六级高频词汇，完成后可继续学习',
    start_url: '/', display: 'standalone', background_color: '#f5f1e8', theme_color: '#23533c',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
