import { NextResponse } from 'next/server';
import { beijingDateKey, getOrCreateDailyWords } from '@/db/daily';

export async function GET() {
  try {
    const studyDate = beijingDateKey();
    const words = await getOrCreateDailyWords(studyDate);
    return NextResponse.json({ studyDate, words });
  } catch (error) {
    console.error('Failed to load daily words', error);
    return NextResponse.json({ error: '暂时无法加载今日进度' }, { status: 500 });
  }
}

