import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { ensureDb } from '@/db';
import { sendPush } from '@/lib/push';

type PushRow = { endpoint: string; p256dh: string; auth: string };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { endpoint?: unknown } | null;
  if (typeof body?.endpoint !== 'string') return NextResponse.json({ error: '缺少通知订阅' }, { status: 400 });
  await ensureDb();
  const row = await env.DB.prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE endpoint = ?')
    .bind(body.endpoint).first<PushRow>();
  if (!row) return NextResponse.json({ error: '未找到通知订阅' }, { status: 404 });
  const response = await sendPush({ endpoint: row.endpoint, expirationTime: null, keys: { p256dh: row.p256dh, auth: row.auth } }, {
    title: '六级词伴', body: '通知开启成功！每天早上 8 点提醒你学习 30 个词。', url: '/',
  });
  return NextResponse.json({ ok: response.ok }, { status: response.ok ? 200 : 502 });
}

