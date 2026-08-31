import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const dailyAssignments = sqliteTable('daily_assignments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studyDate: text('study_date').notNull(),
  wordId: integer('word_id').notNull(),
  position: integer('position').notNull(),
  isReview: integer('is_review', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
}, (table) => [
  uniqueIndex('idx_daily_assignments_date_position').on(table.studyDate, table.position),
  uniqueIndex('idx_daily_assignments_date_word').on(table.studyDate, table.wordId),
  index('idx_daily_assignments_word').on(table.wordId),
]);

export const wordProgress = sqliteTable('word_progress', {
  wordId: integer('word_id').primaryKey(),
  status: text('status', { enum: ['mastered', 'unfamiliar'] }).notNull(),
  reviewCount: integer('review_count').notNull().default(0),
  lastReviewedAt: text('last_reviewed_at').notNull(),
});

export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const notificationLog = sqliteTable('notification_log', {
  studyDate: text('study_date').primaryKey(),
  sentCount: integer('sent_count').notNull().default(0),
  sentAt: text('sent_at').notNull(),
});
