import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import vocabulary from '@/data/vocabulary.json';
import { ensureDb } from '@/db';
import { QUIZ_BATCH_SIZE } from '@/lib/study-config';

type ProgressRow = { word_id: number };
type RecentRow = { word_id: number };

function primaryMeaning(word: (typeof vocabulary)[number]) {
  const item = word.meanings[0];
  return `${item.partOfSpeech ? `${item.partOfSpeech}. ` : ''}${item.meaning}`;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export async function GET(request: NextRequest) {
  await ensureDb();
  const requested = Math.min(60, Math.max(1, Number(request.nextUrl.searchParams.get('count')) || QUIZ_BATCH_SIZE));
  const [progressResult, recentResult] = await Promise.all([
    env.DB.prepare("SELECT word_id FROM word_progress WHERE status = 'mastered'").all<ProgressRow>(),
    env.DB.prepare('SELECT word_id FROM quiz_attempts ORDER BY answered_at DESC LIMIT 100').all<RecentRow>(),
  ]);
  const masteredIds = new Set(progressResult.results.map((row) => row.word_id));
  const recentIds = new Set(recentResult.results.map((row) => row.word_id));
  const mastered = vocabulary.filter((word) => masteredIds.has(word.id));
  const selected = [...shuffle(mastered.filter((word) => !recentIds.has(word.id))), ...shuffle(mastered.filter((word) => recentIds.has(word.id)))].slice(0, requested);
  const sessionId = crypto.randomUUID();
  const questions = selected.map((word) => {
    const partOfSpeech = word.meanings[0]?.partOfSpeech;
    const sameType = vocabulary.filter((candidate) => candidate.id !== word.id && candidate.meanings[0]?.partOfSpeech === partOfSpeech);
    const pool = sameType.length >= 3 ? sameType : vocabulary.filter((candidate) => candidate.id !== word.id);
    const options = new Set([primaryMeaning(word)]);
    for (const candidate of shuffle(pool)) {
      options.add(primaryMeaning(candidate));
      if (options.size === 4) break;
    }
    return { wordId: word.id, word: word.word, phonetic: word.phonetic, options: shuffle([...options]) };
  });
  return NextResponse.json({ sessionId, questions, requested, available: mastered.length });
}
