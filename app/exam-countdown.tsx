'use client';

import { useEffect, useState } from 'react';
import { EXAM_IS_ESTIMATED, examCountdownDays } from '@/lib/study-config';

export default function ExamCountdown() {
  const [days, setDays] = useState(() => examCountdownDays());

  useEffect(() => {
    const timer = window.setInterval(() => setDays(examCountdownDays()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return <div className="exam-countdown"><span>{EXAM_IS_ESTIMATED ? '预计' : ''} 12 月六级</span><strong>倒计时 {days} 天</strong></div>;
}
