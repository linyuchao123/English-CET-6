import { asc, eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import vocabulary from '@/data/vocabulary.json';
import { ensureDb, getDb } from './index';
import { dailyAssignments, wordProgress } from './schema';
import { DAILY_TARGET, EXTRA_DAILY_BATCH, MAX_DAILY_REVIEWS } from '@/lib/study-config';

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

  if (rows.length < DAILY_TARGET) {
    const [assigned, progress] = await Promise.all([
      db.select({ wordId: dailyAssignments.wordId }).from(dailyAssignments),
      db.select().from(wordProgress),
    ]);
    const assignedIds = new Set(assigned.map((row) => row.wordId));
    const wordMap = new Map(vocabulary.map((word) => [word.id, word]));
    const assignedWords = new Set(assigned.map((row) => wordMap.get(row.wordId)?.word).filter(Boolean));
    const todayIds = new Set(rows.map((row) => row.wordId));
    const existingReviews = rows.filter((row) => row.isReview).length;
    const reviews = progress
      .filter((row) => row.status === 'unfamiliar' && !todayIds.has(row.wordId))
      .sort((a, b) => a.lastReviewedAt.localeCompare(b.lastReviewedAt))
      .slice(0, Math.max(0, MAX_DAILY_REVIEWS - existingReviews))
      .map((row) => ({ wordId: row.wordId, isReview: true }));

    const targetNewCount = DAILY_TARGET - rows.length - reviews.length;
    const seenWords = new Set([...assignedWords, ...reviews.map((item) => wordMap.get(item.wordId)?.word).filter(Boolean)]);
    let newWords = [...vocabulary]
      .sort((a, b) => a.frequencyRank - b.frequencyRank)
      .filter((word) => {
        if (assignedIds.has(word.id) || seenWords.has(word.word)) return false;
        seenWords.add(word.word);
        return true;
      }).slice(0, targetNewCount);
    if (newWords.length < targetNewCount) {
      const chosen = new Set([...reviews.map((item) => item.wordId), ...newWords.map((word) => word.id)]);
      const fallback = [...vocabulary].sort((a, b) => a.frequencyRank - b.frequencyRank)
        .filter((word) => !chosen.has(word.id) && !todayIds.has(word.id)).slice(0, targetNewCount - newWords.length);
      newWords = [...newWords, ...fallback];
    }

    const now = new Date().toISOString();
    const values = [
      ...newWords.map((word) => ({ wordId: word.id, isReview: false })),
      ...reviews,
    ].slice(0, DAILY_TARGET - rows.length).map((item, offset) => ({
      studyDate, wordId: item.wordId, isReview: item.isReview, position: rows.length + offset, createdAt: now,
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

export async function getCompletedDailyWordIds(studyDate = beijingDateKey()) {
  await ensureDb();
  const result = await env.DB.prepare(`SELECT DISTINCT da.word_id
    FROM daily_assignments da
    INNER JOIN study_events se ON se.word_id = da.word_id AND se.study_date = da.study_date AND se.source = 'daily'
    WHERE da.study_date = ?`).bind(studyDate).all<{ word_id: number }>();
  return result.results.map((row) => row.word_id);
}

export async function appendDailyWords(studyDate = beijingDateKey(), count = EXTRA_DAILY_BATCH) {
  await ensureDb();
  const db = getDb();
  const rows = await db.select().from(dailyAssignments)
    .where(eq(dailyAssignments.studyDate, studyDate)).orderBy(asc(dailyAssignments.position));
  const [assigned, progress] = await Promise.all([
    db.select({ wordId: dailyAssignments.wordId }).from(dailyAssignments),
    db.select().from(wordProgress),
  ]);
  const wordMap = new Map(vocabulary.map((word) => [word.id, word]));
  const assignedIds = new Set(assigned.map((row) => row.wordId));
  const assignedWords = new Set(assigned.map((row) => wordMap.get(row.wordId)?.word).filter(Boolean));
  const todayIds = new Set(rows.map((row) => row.wordId));
  const learnedIds = new Set(progress.map((row) => row.wordId));
  const seenWords = new Set(assignedWords);
  let selected = [...vocabulary]
    .sort((a, b) => a.frequencyRank - b.frequencyRank)
    .filter((word) => {
      if (assignedIds.has(word.id) || learnedIds.has(word.id) || seenWords.has(word.word)) return false;
      seenWords.add(word.word);
      return true;
    }).slice(0, count);

  if (selected.length < count) {
    const selectedIds = new Set(selected.map((word) => word.id));
    const fallback = [...vocabulary]
      .sort((a, b) => a.frequencyRank - b.frequencyRank)
      .filter((word) => !todayIds.has(word.id) && !selectedIds.has(word.id))
      .slice(0, count - selected.length);
    selected = [...selected, ...fallback];
  }

  const now = new Date().toISOString();
  if (selected.length) {
    await env.DB.batch(selected.map((word, offset) => env.DB.prepare(
      'INSERT OR IGNORE INTO daily_assignments (study_date, word_id, position, is_review, created_at) VALUES (?, ?, ?, 0, ?)',
    ).bind(studyDate, word.id, rows.length + offset, now)));
  }
  return getOrCreateDailyWords(studyDate);
}
