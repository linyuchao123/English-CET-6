import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/db';
import { wordProgress } from '@/db/schema';

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
    const db = getDb();
    await db.insert(wordProgress).values({ wordId, status, reviewCount: 1, lastReviewedAt: now })
      .onConflictDoUpdate({ target: wordProgress.wordId, set: { status, lastReviewedAt: now, reviewCount: 1 } });
    return NextResponse.json({ ok: true, wordId, status });
  } catch (error) {
    console.error('Failed to save progress', error);
    return NextResponse.json({ error: '暂时无法保存学习记录' }, { status: 500 });
  }
}
