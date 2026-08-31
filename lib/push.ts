import { env } from 'cloudflare:workers';
import { buildPushPayload, type PushSubscription } from '@block65/webcrypto-web-push';

export type NotificationPayload = { title: string; body: string; url: string };

export async function sendPush(subscription: PushSubscription, data: NotificationPayload) {
  const request = await buildPushPayload({
    data: JSON.stringify(data),
    options: { ttl: 86_400, urgency: 'normal' },
  }, subscription, {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_SERVER_PUBLIC_KEY,
    privateKey: env.VAPID_SERVER_PRIVATE_KEY,
  });
  return fetch(subscription.endpoint, request);
}

