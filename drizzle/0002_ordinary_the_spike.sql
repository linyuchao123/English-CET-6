CREATE TABLE `quiz_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`word_id` integer NOT NULL,
	`selected_meaning` text NOT NULL,
	`correct_meaning` text NOT NULL,
	`is_correct` integer NOT NULL,
	`answered_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_quiz_attempts_session` ON `quiz_attempts` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_quiz_attempts_word_answered` ON `quiz_attempts` (`word_id`,`answered_at`);--> statement-breakpoint
CREATE TABLE `study_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`study_date` text NOT NULL,
	`word_id` integer NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_study_events_date_source` ON `study_events` (`study_date`,`source`);--> statement-breakpoint
CREATE INDEX `idx_study_events_word` ON `study_events` (`word_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_study_events_unique` ON `study_events` (`word_id`,`source`,`created_at`);