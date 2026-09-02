'use client';

import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/', label: '今日学习' },
  { href: '/vocabulary', label: '词汇总览' },
  { href: '/quiz', label: '掌握检测' },
  { href: '/stats', label: '学习统计' },
];

export default function MainNavigation() {
  const pathname = usePathname();

  return (
    <nav className="main-nav" aria-label="主要导航">
      {navigation.map((item) => {
        const isCurrent = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

        return (
          <a href={item.href} key={item.href} aria-current={isCurrent ? 'page' : undefined}>
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
