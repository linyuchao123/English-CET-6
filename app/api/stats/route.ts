import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import vocabulary from '@/data/vocabulary.json';
import { ensureDb } from '@/db';
import { beijingDateKey } from '@/db/daily';

type ProgressCount = { status: 'mastered' | 'unfamiliar'; count: number };
type DailyRow = { study_date: string; total: number; reviewed: number };

function shiftDate(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  await ensureDb();
  const [progressResult, dailyResult] = await Promise.all([
    env.DB.prepare('SELECT status, COUNT(*) AS count FROM word_progress GROUP BY status').all<ProgressCount>(),
    env.DB.prepare(`SELECT da.study_date, COUNT(*) AS total,
      SUM(CASE WHEN wp.word_id IS NOT NULL THEN 1 ELSE 0 END) AS reviewed
      FROM daily_assignments da LEFT JOIN word_progress wp ON wp.word_id = da.word_id
      GROUP BY da.study_date ORDER BY da.study_date DESC`).all<DailyRow>(),
  ]);
  const mastered = progressResult.results.find((row) => row.status === 'mastered')?.count ?? 0;
  const unfamiliar = progressResult.results.find((row) => row.status === 'unfamiliar')?.count ?? 0;
  const learned = mastered + unfamiliar;
  const completedDates = new Set(dailyResult.results.filter((row) => row.total >= 30 && row.reviewed >= row.total).map((row) => row.study_date));
  const today = beijingDateKey();
  let cursor = completedDates.has(today) ? today : shiftDate(today, -1);
  let streak = 0;
  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  const dailyMap = new Map(dailyResult.results.map((row) => [row.study_date, row]));
  const activity = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(today, index - 6);
    const row = dailyMap.get(date);
    return {
      date,
      label: new Intl.DateTimeFormat('zh-CN', { timeZone: 'UTC', weekday: 'short' }).format(new Date(`${date}T00:00:00Z`)),
      reviewed: Math.min(30, row?.reviewed ?? 0),
    };
  });
  const todayProgress = dailyMap.get(today)?.reviewed ?? 0;
  return NextResponse.json({
    totalWords: vocabulary.length,
    learned,
    mastered,
    unfamiliar,
    unlearned: vocabulary.length - learned,
    masteryRate: learned ? Math.round(mastered / learned * 100) : 0,
    completedDays: completedDates.size,
    streak,
    todayProgress: Math.min(30, todayProgress),
    activity,
  });
}

