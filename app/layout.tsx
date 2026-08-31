import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: '六级词伴｜每天 30 个 CET-6 词汇',
  description: '每天早上 8 点提醒，用简单、稳定的节奏记住 30 个英语六级词汇。',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: '六级词伴', statusBarStyle: 'default' },
};

export const viewport: Viewport = { themeColor: '#f5f1e8' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
