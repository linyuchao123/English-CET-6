import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import vocabulary from '@/data/vocabulary.json';
import { ensureDb } from '@/db';
import { beijingDateKey } from '@/db/daily';

type ProgressCount = { status: 'mastered' | 'unfamiliar'; count: number };
type DailyRow = { study_date: string; total: number; reviewed: number };
type CountRow = { count: number };
type QuizRow = { total: number; correct: number };

function shiftDate(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  await ensureDb();
  const today = beijingDateKey();
  const todayDate = new Date(`${today}T00:00:00Z`);
  const weekStart = shiftDate(today, -((todayDate.getUTCDay() + 6) % 7));
  const monthStart = `${today.slice(0, 7)}-01`;
  const [progressResult, dailyResult, weekResult, monthResult, quizResult] = await Promise.all([
    env.DB.prepare('SELECT status, COUNT(*) AS count FROM word_progress GROUP BY status').all<ProgressCount>(),
    env.DB.prepare(`SELECT da.study_date, COUNT(DISTINCT da.word_id) AS total,
      COUNT(DISTINCT CASE WHEN se.word_id IS NOT NULL THEN da.word_id END) AS reviewed
      FROM daily_assignments da LEFT JOIN study_events se ON se.word_id = da.word_id AND se.study_date = da.study_date
      GROUP BY da.study_date ORDER BY da.study_date DESC`).all<DailyRow>(),
    env.DB.prepare(`SELECT COUNT(*) AS count FROM (
      SELECT word_id, MIN(study_date) AS first_date FROM study_events GROUP BY word_id
    ) WHERE first_date >= ? AND first_date <= ?`).bind(weekStart, today).first<CountRow>(),
    env.DB.prepare(`SELECT COUNT(*) AS count FROM (
      SELECT word_id, MIN(study_date) AS first_date FROM study_events GROUP BY word_id
    ) WHERE first_date >= ? AND first_date <= ?`).bind(monthStart, today).first<CountRow>(),
    env.DB.prepare('SELECT COUNT(*) AS total, COALESCE(SUM(is_correct), 0) AS correct FROM quiz_attempts').first<QuizRow>(),
  ]);
  const mastered = progressResult.results.find((row) => row.status === 'mastered')?.count ?? 0;
  const unfamiliar = progressResult.results.find((row) => row.status === 'unfamiliar')?.count ?? 0;
  const learned = mastered + unfamiliar;
  const completedDates = new Set(dailyResult.results.filter((row) => row.total > 0 && row.reviewed >= row.total).map((row) => row.study_date));
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
      reviewed: Math.min(50, row?.reviewed ?? 0),
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
    todayProgress: Math.min(50, todayProgress),
    weeklyLearned: weekResult?.count ?? 0,
    monthlyLearned: monthResult?.count ?? 0,
    quizAttempts: quizResult?.total ?? 0,
    quizAccuracy: quizResult?.total ? Math.round(quizResult.correct / quizResult.total * 100) : 0,
    activity,
  });
}
