import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  nickname: text('nickname').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  prompt: text('prompt').notNull(),
  selectedVariantId: uuid('selected_variant_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const runs = pgTable('runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  status: text('status').notNull().default('running'),
  source: text('source').notNull().default('llm'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const variants = pgTable('variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id')
    .notNull()
    .references(() => runs.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  idx: integer('idx').notNull(),
  persona: text('persona').notNull(),
  html: text('html').notNull(),
  score: integer('score'),
  reasoning: text('reasoning'),
  latencyMs: integer('latency_ms'),
  tokens: integer('tokens'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const versions = pgTable('versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id'),
  parentVersionId: uuid('parent_version_id'),
  prompt: text('prompt').notNull(),
  html: text('html').notNull(),
  title: text('title'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Run = typeof runs.$inferSelect;
export type Variant = typeof variants.$inferSelect;
export type Version = typeof versions.$inferSelect;
