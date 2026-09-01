import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { ensureDb } from '@/db';
import { beijingDateKey, getOrCreateDailyWords } from '@/db/daily';
import { sendPush } from '@/lib/push';

type PushRow = { endpoint: string; p256dh: string; auth: string };

export async function POST(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${env.DAILY_PUSH_TOKEN}`) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  await ensureDb();
  const studyDate = beijingDateKey();
  const now = new Date().toISOString();
  const reservation = await env.DB.prepare(
    'INSERT OR IGNORE INTO notification_log (study_date, sent_count, sent_at) VALUES (?, -1, ?)',
  ).bind(studyDate, now).run();
  if (!reservation.meta.changes) return NextResponse.json({ ok: true, skipped: true, studyDate });

  await getOrCreateDailyWords(studyDate);
  const { results } = await env.DB.prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions').all<PushRow>();
  let sentCount = 0;
  for (const row of results) {
    const response = await sendPush({ endpoint: row.endpoint, expirationTime: null, keys: { p256dh: row.p256dh, auth: row.auth } }, {
      title: '六级词伴 · 今日 50 词', body: '今天的六级高频词和薄弱复习词已经准备好。', url: '/',
    }).catch(() => null);
    if (response?.ok) sentCount += 1;
    if (response && [404, 410].includes(response.status)) {
      await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(row.endpoint).run();
    }
  }
  await env.DB.prepare('UPDATE notification_log SET sent_count = ?, sent_at = ? WHERE study_date = ?')
    .bind(sentCount, new Date().toISOString(), studyDate).run();
  return NextResponse.json({ ok: true, studyDate, sentCount });
}
