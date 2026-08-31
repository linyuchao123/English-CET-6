import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { ensureDb } from '@/db';

type SubscriptionBody = { endpoint?: unknown; expirationTime?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as SubscriptionBody | null;
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  const p256dh = typeof body?.keys?.p256dh === 'string' ? body.keys.p256dh : '';
  const auth = typeof body?.keys?.auth === 'string' ? body.keys.auth : '';
  if (!endpoint.startsWith('https://') || !p256dh || !auth) {
    return NextResponse.json({ error: '通知订阅格式不正确' }, { status: 400 });
  }
  await ensureDb();
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO push_subscriptions (endpoint, p256dh, auth, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, updated_at = excluded.updated_at`)
    .bind(endpoint, p256dh, auth, now, now).run();
  return NextResponse.json({ ok: true });
}

