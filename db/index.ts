import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDb() {
  if (!env.DB) {
    throw new Error(
      'Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database.',
    );
  }

  return drizzle(env.DB, { schema });
}

let schemaReady: Promise<void> | undefined;

export function ensureDb() {
  if (!env.DB) throw new Error('Cloudflare D1 binding `DB` is unavailable.');
  if (!schemaReady) {
    const statements = [
      `CREATE TABLE IF NOT EXISTS daily_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        study_date TEXT NOT NULL,
        word_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        is_review INTEGER DEFAULT 0 NOT NULL,
        created_at TEXT NOT NULL
      )`,
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_assignments_date_position ON daily_assignments (study_date, position)',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_assignments_date_word ON daily_assignments (study_date, word_id)',
      'CREATE INDEX IF NOT EXISTS idx_daily_assignments_word ON daily_assignments (word_id)',
      `CREATE TABLE IF NOT EXISTS word_progress (
        word_id INTEGER PRIMARY KEY NOT NULL,
        status TEXT NOT NULL,
        review_count INTEGER DEFAULT 0 NOT NULL,
        last_reviewed_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS study_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        study_date TEXT NOT NULL,
        word_id INTEGER NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      'CREATE INDEX IF NOT EXISTS idx_study_events_date_source ON study_events (study_date, source)',
      'CREATE INDEX IF NOT EXISTS idx_study_events_word ON study_events (word_id)',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_study_events_unique ON study_events (word_id, source, created_at)',
      `CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        session_id TEXT NOT NULL,
        word_id INTEGER NOT NULL,
        selected_meaning TEXT NOT NULL,
        correct_meaning TEXT NOT NULL,
        is_correct INTEGER NOT NULL,
        answered_at TEXT NOT NULL
      )`,
      'CREATE INDEX IF NOT EXISTS idx_quiz_attempts_session ON quiz_attempts (session_id)',
      'CREATE INDEX IF NOT EXISTS idx_quiz_attempts_word_answered ON quiz_attempts (word_id, answered_at)',
      `CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS notification_log (
        study_date TEXT PRIMARY KEY NOT NULL,
        sent_count INTEGER DEFAULT 0 NOT NULL,
        sent_at TEXT NOT NULL
      )`,
    ].map((statement) => env.DB.prepare(statement));
    schemaReady = env.DB.batch(statements).then(async () => {
      await env.DB.prepare(`INSERT OR IGNORE INTO study_events (study_date, word_id, source, status, created_at)
        SELECT substr(last_reviewed_at, 1, 10), word_id, 'manual', status, last_reviewed_at FROM word_progress`).run();
      await env.DB.prepare('PRAGMA optimize').run();
    });
  }
  return schemaReady;
}
