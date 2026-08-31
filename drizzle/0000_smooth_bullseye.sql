CREATE TABLE `daily_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`study_date` text NOT NULL,
	`word_id` integer NOT NULL,
	`position` integer NOT NULL,
	`is_review` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_daily_assignments_date_position` ON `daily_assignments` (`study_date`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_daily_assignments_date_word` ON `daily_assignments` (`study_date`,`word_id`);--> statement-breakpoint
CREATE INDEX `idx_daily_assignments_word` ON `daily_assignments` (`word_id`);--> statement-breakpoint
CREATE TABLE `word_progress` (
	`word_id` integer PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`review_count` integer DEFAULT 0 NOT NULL,
	`last_reviewed_at` text NOT NULL
);
