import ExamCountdown from './exam-countdown';
import Link from 'next/link';

const navigation = [
  { href: '/', label: '今日学习' },
  { href: '/vocabulary', label: '词汇总览' },
  { href: '/quiz', label: '掌握检测' },
  { href: '/stats', label: '学习统计' },
];

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="六级词伴首页"><span className="brand-mark">C6</span><span>六级词伴</span></Link>
        <ExamCountdown />
        <nav className="main-nav" aria-label="主要导航">
          {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
      </div>
    </header>
  );
}
