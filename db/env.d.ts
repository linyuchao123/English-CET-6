declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    VAPID_SUBJECT: string;
    VAPID_SERVER_PUBLIC_KEY: string;
    VAPID_SERVER_PRIVATE_KEY: string;
    DAILY_PUSH_TOKEN: string;
  }
}
