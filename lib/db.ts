import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const sql = neon(process.env.DATABASE_URL)

/**
 * Creates the notes table if it doesn't exist yet.
 * Call this from any server-side code before querying.
 */
export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS note_sessions (
      id            TEXT PRIMARY KEY,
      user_id       TEXT,
      notes         TEXT        NOT NULL,
      url           TEXT        NOT NULL DEFAULT '',
      title         TEXT,
      video_id      TEXT,
      word_count    INTEGER,
      depth         TEXT,
      language      TEXT,
      generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  // Add user_id column if it doesn't exist (for existing tables)
  await sql`
    ALTER TABLE note_sessions ADD COLUMN IF NOT EXISTS user_id TEXT;
  `
}

export interface NoteSession {
  id: string
  userId?: string
  notes: string
  url: string
  title?: string
  videoId?: string
  wordCount?: number
  depth?: string
  language?: string
  generatedAt: string
}

/** Insert a new note session */
export async function insertNote(session: NoteSession) {
  await initDb()
  await sql`
    INSERT INTO note_sessions (id, user_id, notes, url, title, video_id, word_count, depth, language, generated_at)
    VALUES (
      ${session.id},
      ${session.userId ?? null},
      ${session.notes},
      ${session.url},
      ${session.title ?? null},
      ${session.videoId ?? null},
      ${session.wordCount ?? null},
      ${session.depth ?? null},
      ${session.language ?? null},
      ${session.generatedAt}
    )
    ON CONFLICT (id) DO NOTHING
  `
}

/** Fetch a single note session by id (optionally enforcing userId) */
export async function getNoteById(id: string, userId?: string): Promise<NoteSession | null> {
  await initDb()
  const rows = userId
    ? await sql`
        SELECT id, user_id, notes, url, title, video_id, word_count, depth, language, generated_at
        FROM note_sessions
        WHERE id = ${id} AND (user_id = ${userId} OR user_id IS NULL)
        LIMIT 1
      `
    : await sql`
        SELECT id, user_id, notes, url, title, video_id, word_count, depth, language, generated_at
        FROM note_sessions
        WHERE id = ${id}
        LIMIT 1
      `
  if (!rows.length) return null
  return rowToSession(rows[0])
}

/** Fetch all notes for a user ordered by most recent first */
export async function getAllNotes(userId?: string): Promise<NoteSession[]> {
  await initDb()
  const rows = userId
    ? await sql`
        SELECT id, user_id, notes, url, title, video_id, word_count, depth, language, generated_at
        FROM note_sessions
        WHERE user_id = ${userId} OR user_id IS NULL
        ORDER BY generated_at DESC
      `
    : await sql`
        SELECT id, user_id, notes, url, title, video_id, word_count, depth, language, generated_at
        FROM note_sessions
        ORDER BY generated_at DESC
      `
  return rows.map(rowToSession)
}

/** Fetch the N most recent notes for a user */
export async function getRecentNotes(limit = 6, userId?: string): Promise<NoteSession[]> {
  await initDb()
  const rows = userId
    ? await sql`
        SELECT id, user_id, notes, url, title, video_id, word_count, depth, language, generated_at
        FROM note_sessions
        WHERE user_id = ${userId} OR user_id IS NULL
        ORDER BY generated_at DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT id, user_id, notes, url, title, video_id, word_count, depth, language, generated_at
        FROM note_sessions
        ORDER BY generated_at DESC
        LIMIT ${limit}
      `
  return rows.map(rowToSession)
}

/** Total count of notes for a user */
export async function getNoteCount(userId?: string): Promise<number> {
  await initDb()
  const rows = userId
    ? await sql`SELECT COUNT(*)::int AS count FROM note_sessions WHERE user_id = ${userId} OR user_id IS NULL`
    : await sql`SELECT COUNT(*)::int AS count FROM note_sessions`
  return rows[0]?.count ?? 0
}

/** Permanently delete a note session by id (enforcing userId ownership when provided) */
export async function deleteNoteById(id: string, userId?: string): Promise<boolean> {
  await initDb()
  const result = userId
    ? await sql`
        DELETE FROM note_sessions
        WHERE id = ${id} AND (user_id = ${userId} OR user_id IS NULL)
        RETURNING id
      `
    : await sql`
        DELETE FROM note_sessions
        WHERE id = ${id}
        RETURNING id
      `
  return result.length > 0
}

function rowToSession(row: any): NoteSession {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    notes: row.notes,
    url: row.url,
    title: row.title ?? undefined,
    videoId: row.video_id ?? undefined,
    wordCount: row.word_count ?? undefined,
    depth: row.depth ?? undefined,
    language: row.language ?? undefined,
    generatedAt: row.generated_at instanceof Date
      ? row.generated_at.toISOString()
      : String(row.generated_at),
  }
}
