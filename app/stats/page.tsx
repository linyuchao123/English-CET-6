'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

type Stats = {
  totalWords: number;
  learned: number;
  mastered: number;
  unfamiliar: number;
  unlearned: number;
  masteryRate: number;
  completedDays: number;
  streak: number;
  todayProgress: number;
  activity: { date: string; label: string; reviewed: number }[];
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { fetch('/api/stats').then((response) => response.json()).then(setStats); }, []);
  const learnedRate = stats ? Math.round(stats.learned / stats.totalWords * 100) : 0;

  return (
    <main className="content-shell">
      <section className="page-heading stats-heading">
        <div><p className="eyebrow">LEARNING REPORT</p><h1>每一点积累，都算数。</h1></div>
        <p>这里记录你的学习节奏、词汇掌握情况和连续完成天数。先保持每天完成，再慢慢提高掌握率。</p>
      </section>

      <section className="metric-grid" aria-label="学习核心指标">
        <article><span>已学习词汇</span><strong>{stats?.learned ?? '—'}</strong><small>占全部词库 {learnedRate}%</small></article>
        <article><span>已掌握</span><strong>{stats?.mastered ?? '—'}</strong><small>当前掌握率 {stats?.masteryRate ?? 0}%</small></article>
        <article><span>连续学习</span><strong>{stats?.streak ?? '—'}<em> 天</em></strong><small>完成当天 30 词即计入</small></article>
        <article><span>完成天数</span><strong>{stats?.completedDays ?? '—'}<em> 天</em></strong><small>坚持比一次学很多更重要</small></article>
      </section>

      <section className="report-grid">
        <article className="report-card activity-card">
          <div className="report-title"><div><span>近 7 天学习量</span><small>每天目标 30 词</small></div><strong>{stats?.todayProgress ?? 0}<em>/30</em></strong></div>
          <div className="bar-chart" aria-label="最近七天学习量柱状图">
            {stats?.activity.map((day) => (
              <div className="bar-column" key={day.date} title={`${day.date}：${day.reviewed} 词`}>
                <span>{day.reviewed || ''}</span>
                <div className="bar-track"><i style={{ height: `${Math.max(5, day.reviewed / 30 * 100)}%` }} /></div>
                <small>{day.label}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="report-card distribution-card">
          <div className="report-title"><div><span>词汇掌握分布</span><small>全部 {stats?.totalWords ?? 5651} 词</small></div></div>
          <div className="distribution-body">
            <div className="donut" style={{ '--mastered': `${stats ? stats.mastered / stats.totalWords * 100 : 0}%`, '--weak': `${stats ? (stats.mastered + stats.unfamiliar) / stats.totalWords * 100 : 0}%` } as CSSProperties}>
              <div><strong>{learnedRate}%</strong><span>已学习</span></div>
            </div>
            <div className="legend">
              <p><i className="mastered" /><span>已掌握</span><strong>{stats?.mastered ?? 0}</strong></p>
              <p><i className="unfamiliar" /><span>薄弱词</span><strong>{stats?.unfamiliar ?? 0}</strong></p>
              <p><i className="unlearned" /><span>未学习</span><strong>{stats?.unlearned ?? 5651}</strong></p>
            </div>
          </div>
        </article>
      </section>

      <section className="study-tip">
        <span className="tip-mark">!</span>
        <div><strong>今天的建议</strong><p>{stats?.unfamiliar ? `你有 ${stats.unfamiliar} 个薄弱词，完成今日新词后可以到词汇总览集中复习。` : '先完成今天的 30 个词，标记不熟的词会自动进入后续复习。'}</p></div>
      </section>
    </main>
  );
}
