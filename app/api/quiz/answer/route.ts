import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import vocabulary from '@/data/vocabulary.json';
import { ensureDb } from '@/db';
import { beijingDateKey } from '@/db/daily';

function primaryMeaning(word: (typeof vocabulary)[number]) {
  const item = word.meanings[0];
  return `${item.partOfSpeech ? `${item.partOfSpeech}. ` : ''}${item.meaning}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { sessionId?: unknown; wordId?: unknown; selectedMeaning?: unknown } | null;
  if (!body || typeof body.sessionId !== 'string' || !Number.isInteger(body.wordId) || typeof body.selectedMeaning !== 'string') {
    return NextResponse.json({ error: '答题记录格式不正确' }, { status: 400 });
  }
  const word = vocabulary.find((item) => item.id === body.wordId);
  if (!word) return NextResponse.json({ error: '没有找到这个单词' }, { status: 404 });
  const correctMeaning = primaryMeaning(word);
  const isCorrect = body.selectedMeaning === correctMeaning;
  const status = isCorrect ? 'mastered' : 'unfamiliar';
  const now = new Date().toISOString();
  await ensureDb();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO quiz_attempts (session_id, word_id, selected_meaning, correct_meaning, is_correct, answered_at)
      VALUES (?, ?, ?, ?, ?, ?)`).bind(body.sessionId, word.id, body.selectedMeaning, correctMeaning, isCorrect ? 1 : 0, now),
    env.DB.prepare(`INSERT INTO word_progress (word_id, status, review_count, last_reviewed_at) VALUES (?, ?, 1, ?)
      ON CONFLICT(word_id) DO UPDATE SET status = excluded.status, review_count = word_progress.review_count + 1, last_reviewed_at = excluded.last_reviewed_at`)
      .bind(word.id, status, now),
    env.DB.prepare('INSERT INTO study_events (study_date, word_id, source, status, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(beijingDateKey(), word.id, 'quiz', status, now),
  ]);
  return NextResponse.json({ correct: isCorrect, correctMeaning, status, word: word.word });
}
