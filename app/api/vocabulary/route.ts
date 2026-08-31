import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import vocabulary from '@/data/vocabulary.json';
import { ensureDb } from '@/db';

type Status = 'mastered' | 'unfamiliar';
type ProgressRow = { word_id: number; status: Status };

export async function GET(request: NextRequest) {
  await ensureDb();
  const params = request.nextUrl.searchParams;
  const query = (params.get('query') ?? '').trim().toLowerCase();
  const status = params.get('status') ?? 'all';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const pageSize = 40;
  const { results } = await env.DB.prepare('SELECT word_id, status FROM word_progress').all<ProgressRow>();
  const progress = new Map(results.map((row) => [row.word_id, row.status]));
  const counts = { all: vocabulary.length, mastered: 0, unfamiliar: 0, unlearned: 0 };
  for (const word of vocabulary) {
    const current = progress.get(word.id);
    if (current === 'mastered') counts.mastered += 1;
    else if (current === 'unfamiliar') counts.unfamiliar += 1;
    else counts.unlearned += 1;
  }
  const filtered = vocabulary.filter((word) => {
    const current = progress.get(word.id) ?? 'unlearned';
    const matchesStatus = status === 'all' || current === status;
    const matchesQuery = !query || word.word.toLowerCase().includes(query) || word.translation.includes(query);
    return matchesStatus && matchesQuery;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const words = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
    .map((word) => ({ ...word, status: progress.get(word.id) ?? 'unlearned' }));
  return NextResponse.json({ words, counts, page: safePage, totalPages, total: filtered.length });
}

