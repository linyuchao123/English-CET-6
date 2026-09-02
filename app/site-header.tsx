import ExamCountdown from './exam-countdown';
import MainNavigation from './main-navigation';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Keep homepage navigation available even if client routing fails. */}
        <a className="brand" href="/" aria-label="六级词伴首页"><span className="brand-mark">C6</span><span>六级词伴</span></a>
        <ExamCountdown />
        <MainNavigation />
      </div>
    </header>
  );
}
