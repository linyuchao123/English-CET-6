import type { CSSProperties } from 'react';

export type HeatmapDay = {
  date: string;
  count: number;
};

type HeatmapCell = HeatmapDay | null;

function activityLevel(count: number) {
  if (count <= 0) return 0;
  if (count <= 12) return 1;
  if (count <= 30) return 2;
  if (count <= 45) return 3;
  if (count < 60) return 4;
  return 5;
}

function formatDate(dateKey: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

export default function LearningHeatmap({ activity }: { activity: HeatmapDay[] }) {
  if (!activity.length) {
    return <section className="heatmap-card heatmap-loading" aria-label="学习热力图正在加载">正在整理过去一年的学习记录…</section>;
  }

  const firstWeekday = new Date(`${activity[0].date}T00:00:00Z`).getUTCDay();
  const cells: HeatmapCell[] = [...Array<HeatmapCell>(firstWeekday).fill(null), ...activity];
  while (cells.length % 7) cells.push(null);
  const weeks = cells.length / 7;
  const monthLabels = activity.flatMap((day, index) => {
    const date = new Date(`${day.date}T00:00:00Z`);
    if (date.getUTCDate() !== 1) return [];
    return [{
      label: new Intl.DateTimeFormat('zh-CN', { timeZone: 'UTC', month: 'short' }).format(date),
      week: Math.floor((firstWeekday + index) / 7),
    }];
  });
  const activeDays = activity.filter((day) => day.count > 0).length;
  const learnedCount = activity.reduce((total, day) => total + day.count, 0);
  const gridStyle: CSSProperties = { width: `${weeks * 16 + 28}px` };

  return (
    <section className="heatmap-card" aria-labelledby="heatmap-title">
      <div className="heatmap-heading">
        <div><strong id="heatmap-title">过去一年学习记录</strong><span>每天记过的单词越多，颜色越深</span></div>
        <p><b>{activeDays}</b> 个学习日 · 共学习 <b>{learnedCount}</b> 词次</p>
      </div>
      <div className="heatmap-scroll">
        <div className="heatmap-content" style={gridStyle}>
          <div className="heatmap-months" aria-hidden="true">
            {monthLabels.map((month) => <span style={{ left: `${month.week * 16}px` }} key={`${month.week}-${month.label}`}>{month.label}</span>)}
          </div>
          <div className="heatmap-body">
            <div className="heatmap-weekdays" aria-hidden="true"><span>一</span><span>三</span><span>五</span></div>
            <div className="heatmap-grid" role="img" aria-label={`过去一年共学习 ${learnedCount} 词次，活跃 ${activeDays} 天`}>
              {cells.map((day, index) => day ? (
                <span
                  className={`heatmap-cell level-${activityLevel(day.count)}`}
                  title={`${formatDate(day.date)}：${day.count} 个单词`}
                  aria-label={`${formatDate(day.date)}，学习 ${day.count} 个单词`}
                  key={day.date}
                />
              ) : <span className="heatmap-cell empty" aria-hidden="true" key={`empty-${index}`} />)}
            </div>
          </div>
        </div>
      </div>
      <div className="heatmap-legend" aria-label="颜色图例"><span>少</span>{[0, 1, 2, 3, 4, 5].map((level) => <i className={`heatmap-cell level-${level}`} key={level} />)}<span>多</span></div>
    </section>
  );
}
