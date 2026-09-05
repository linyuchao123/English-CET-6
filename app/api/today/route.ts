import { NextResponse } from 'next/server';
import { appendDailyWords, beijingDateKey, getCompletedDailyWordIds, getOrCreateDailyWords } from '@/db/daily';

export async function GET() {
  try {
    const studyDate = beijingDateKey();
    const words = await getOrCreateDailyWords(studyDate);
    const completedWordIds = await getCompletedDailyWordIds(studyDate);
    return NextResponse.json({ studyDate, words, completedWordIds });
  } catch (error) {
    console.error('Failed to load daily words', error);
    return NextResponse.json({ error: '暂时无法加载今日进度' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const studyDate = beijingDateKey();
    const currentWords = await getOrCreateDailyWords(studyDate);
    const completedWordIds = await getCompletedDailyWordIds(studyDate);
    if (completedWordIds.length < currentWords.length) {
      return NextResponse.json({
        error: `请先完成当前词单，还剩 ${currentWords.length - completedWordIds.length} 个词`,
      }, { status: 409 });
    }
    const words = await appendDailyWords(studyDate);
    return NextResponse.json({ studyDate, words, completedWordIds });
  } catch (error) {
    console.error('Failed to append daily words', error);
    return NextResponse.json({ error: '暂时无法追加新词' }, { status: 500 });
  }
}
