import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import SiteHeader from './site-header';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_ORIGIN ?? 'http://localhost:3000'),
  title: '六级词伴｜每天 50 个 CET-6 高频词',
  description: '每天早上 8 点提醒，优先掌握 50 个英语六级高频词汇。',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: '六级词伴', statusBarStyle: 'default' },
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
  openGraph: {
    title: '六级词伴', description: '每天 50 个高频词，稳稳过六级', type: 'website', images: ['/og.png'],
  },
  twitter: { card: 'summary_large_image', title: '六级词伴', description: '每天 50 个高频词，稳稳过六级', images: ['/og.png'] },
};

export const viewport: Viewport = { themeColor: '#f5f1e8' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className={`${geistSans.variable} ${geistMono.variable}`}><SiteHeader />{children}</body></html>;
}
