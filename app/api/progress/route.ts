import { NextRequest, NextResponse } from 'next/server';
import { ensureDb } from '@/db';
import { env } from 'cloudflare:workers';
import { beijingDateKey } from '@/db/daily';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { wordId?: unknown; status?: unknown } | null;
  if (!body || !Number.isInteger(body.wordId) || !['mastered', 'unfamiliar'].includes(String(body.status))) {
    return NextResponse.json({ error: '学习记录格式不正确' }, { status: 400 });
  }
  const wordId = body.wordId as number;
  const status = body.status as 'mastered' | 'unfamiliar';
  const now = new Date().toISOString();
  try {
    await ensureDb();
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO word_progress (word_id, status, review_count, last_reviewed_at) VALUES (?, ?, 1, ?)
        ON CONFLICT(word_id) DO UPDATE SET status = excluded.status, review_count = word_progress.review_count + 1, last_reviewed_at = excluded.last_reviewed_at`)
        .bind(wordId, status, now),
      env.DB.prepare('INSERT INTO study_events (study_date, word_id, source, status, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(beijingDateKey(), wordId, 'daily', status, now),
    ]);
    return NextResponse.json({ ok: true, wordId, status });
  } catch (error) {
    console.error('Failed to save progress', error);
    return NextResponse.json({ error: '暂时无法保存学习记录' }, { status: 500 });
  }
}
