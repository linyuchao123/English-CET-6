import { asc, eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import vocabulary from '@/data/vocabulary.json';
import { ensureDb, getDb } from './index';
import { dailyAssignments, wordProgress } from './schema';

export function beijingDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export async function getOrCreateDailyWords(studyDate = beijingDateKey()) {
  await ensureDb();
  const db = getDb();
  let rows = await db.select().from(dailyAssignments)
    .where(eq(dailyAssignments.studyDate, studyDate)).orderBy(asc(dailyAssignments.position));

  if (rows.length < 30) {
    const [assigned, progress] = await Promise.all([
      db.select({ wordId: dailyAssignments.wordId }).from(dailyAssignments),
      db.select().from(wordProgress),
    ]);
    const assignedIds = new Set(assigned.map((row) => row.wordId));
    const reviews = progress
      .filter((row) => row.status === 'unfamiliar')
      .sort((a, b) => a.lastReviewedAt.localeCompare(b.lastReviewedAt))
      .slice(0, 6)
      .map((row) => ({ wordId: row.wordId, isReview: true }));

    const targetNewCount = 30 - reviews.length;
    let newWords = vocabulary.filter((word) => !assignedIds.has(word.id)).slice(0, targetNewCount);
    if (newWords.length < targetNewCount) {
      const chosen = new Set([...reviews.map((item) => item.wordId), ...newWords.map((word) => word.id)]);
      const fallback = vocabulary.filter((word) => !chosen.has(word.id)).slice(0, targetNewCount - newWords.length);
      newWords = [...newWords, ...fallback];
    }

    const now = new Date().toISOString();
    const values = [
      ...newWords.map((word) => ({ wordId: word.id, isReview: false })),
      ...reviews,
    ].slice(0, 30).map((item, position) => ({
      studyDate, wordId: item.wordId, isReview: item.isReview, position, createdAt: now,
    }));
    if (values.length) {
      await env.DB.batch(values.map((value) => env.DB.prepare(
        'INSERT OR IGNORE INTO daily_assignments (study_date, word_id, position, is_review, created_at) VALUES (?, ?, ?, ?, ?)',
      ).bind(value.studyDate, value.wordId, value.position, value.isReview ? 1 : 0, value.createdAt)));
    }
    rows = await db.select().from(dailyAssignments)
      .where(eq(dailyAssignments.studyDate, studyDate)).orderBy(asc(dailyAssignments.position));
  }

  const progress = await db.select().from(wordProgress);
  const progressMap = new Map(progress.map((row) => [row.wordId, row.status]));
  const wordMap = new Map(vocabulary.map((word) => [word.id, word]));
  return rows.map((row) => ({ ...wordMap.get(row.wordId)!, isReview: row.isReview, status: progressMap.get(row.wordId) ?? null }));
}
