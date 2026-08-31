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
    ].map((statement) => env.DB.prepare(statement));
    schemaReady = env.DB.batch(statements).then(() => undefined);
  }
  return schemaReady;
}
