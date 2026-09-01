import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import vocabulary from '@/data/vocabulary.json';
import { ensureDb } from '@/db';

type Status = 'mastered' | 'unfamiliar';
type ProgressRow = { word_id: number; status: Status; last_reviewed_at: string };
type VerifiedRow = { word_id: number };

export async function GET(request: NextRequest) {
  await ensureDb();
  const params = request.nextUrl.searchParams;
  const query = (params.get('query') ?? '').trim().toLowerCase();
  const status = params.get('status') ?? 'all';
  const scope = params.get('scope') ?? 'all';
  const sort = params.get('sort') ?? 'frequency';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const pageSize = 40;
  const [{ results }, verifiedResult] = await Promise.all([
    env.DB.prepare('SELECT word_id, status, last_reviewed_at FROM word_progress').all<ProgressRow>(),
    env.DB.prepare('SELECT DISTINCT word_id FROM quiz_attempts WHERE is_correct = 1').all<VerifiedRow>(),
  ]);
  const progress = new Map(results.map((row) => [row.word_id, row.status]));
  const recent = new Map(results.map((row) => [row.word_id, row.last_reviewed_at]));
  const verified = new Set(verifiedResult.results.map((row) => row.word_id));
  const counts = { all: vocabulary.length, mastered: 0, unfamiliar: 0, unlearned: 0 };
  const coreCounts = { all: 0, mastered: 0, unfamiliar: 0, unlearned: 0, verified: 0 };
  for (const word of vocabulary) {
    const current = progress.get(word.id);
    if (current === 'mastered') counts.mastered += 1;
    else if (current === 'unfamiliar') counts.unfamiliar += 1;
    else counts.unlearned += 1;
    if (word.isHighFrequency) {
      coreCounts.all += 1;
      if (current === 'mastered') coreCounts.mastered += 1;
      else if (current === 'unfamiliar') coreCounts.unfamiliar += 1;
      else coreCounts.unlearned += 1;
      if (verified.has(word.id)) coreCounts.verified += 1;
    }
  }
  const filtered = vocabulary.filter((word) => {
    const current = progress.get(word.id) ?? 'unlearned';
    const matchesStatus = status === 'all' || current === status;
    const matchesScope = scope !== 'core' || word.isHighFrequency;
    const matchesQuery = !query || word.word.toLowerCase().includes(query) || word.translation.includes(query)
      || word.phrases.some((phrase) => phrase.phrase.toLowerCase().includes(query) || phrase.meaning.includes(query));
    return matchesStatus && matchesScope && matchesQuery;
  }).sort((a, b) => {
    if (sort === 'alphabetical') return a.word.localeCompare(b.word);
    if (sort === 'recent') return (recent.get(b.id) ?? '').localeCompare(recent.get(a.id) ?? '') || a.frequencyRank - b.frequencyRank;
    return a.frequencyRank - b.frequencyRank;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const words = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
    .map((word) => ({ ...word, status: progress.get(word.id) ?? 'unlearned', verified: verified.has(word.id) }));
  return NextResponse.json({ words, counts, coreCounts, page: safePage, totalPages, total: filtered.length });
}
