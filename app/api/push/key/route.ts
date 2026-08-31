import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ publicKey: env.VAPID_SERVER_PUBLIC_KEY });
}

