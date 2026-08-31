const navigation = [
  { href: '/', label: '今日学习' },
  { href: '/vocabulary', label: '词汇总览' },
  { href: '/stats', label: '学习统计' },
];

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="/" aria-label="六级词伴首页"><span className="brand-mark">C6</span><span>六级词伴</span></a>
        <nav className="main-nav" aria-label="主要导航">
          {navigation.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        </nav>
      </div>
    </header>
  );
}
