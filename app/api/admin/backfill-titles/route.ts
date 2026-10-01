import { NextResponse } from 'next/server'
import { sql, initDb } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * Extract the main title from the first H1 heading in the generated notes.
 * Strips emojis and extra whitespace.
 */
function extractTitleFromNotes(notes: string): string | null {
  const match = notes.match(/^#\s+(.+)/m)
  if (!match) return null
  return match[1]
    .replace(/[\u{1F4DA}\u{1F3AF}\u{1F511}\u{1F4D6}\u{1F4A1}\u2696\uFE0F\u{1F680}\u{1F4DD}\u{1F4CC}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim() || null
}

/**
 * Returns true if the stored title is a bad/fallback title that should be replaced.
 * Patterns to replace:
 *   - null / empty
 *   - "Untitled Study Guide"
 *   - Contains a raw YouTube video ID (e.g. "TYo_CUnIWP8")
 *   - Starts with "YouTube lecture"
 *   - Is exactly a video ID (11 alphanumeric chars + underscores/hyphens)
 */
function isBadTitle(title: string | null): boolean {
  if (!title || title.trim() === '') return true
  const t = title.trim()
  if (t === 'Untitled Study Guide') return true
  if (/youtube\s+lecture/i.test(t)) return true
  // Raw video ID pattern anywhere in title
  if (/\b[A-Za-z0-9_-]{11}\b/.test(t) && t.length <= 30) return true
  return false
}

/** POST /api/admin/backfill-titles — one-time migration to fix bad note titles */
export async function POST() {
  try {
    await initDb()

    // Fetch all notes with potentially bad titles
    const rows = await sql`
      SELECT id, title, notes
      FROM note_sessions
      ORDER BY generated_at DESC
    `

    let updated = 0
    let skipped = 0
    const results: { id: string; old: string | null; new: string | null; action: string }[] = []

    for (const row of rows) {
      const currentTitle: string | null = row.title ?? null
      const notes: string = row.notes ?? ''

      if (!isBadTitle(currentTitle)) {
        skipped++
        results.push({ id: row.id, old: currentTitle, new: null, action: 'skipped' })
        continue
      }

      const extracted = extractTitleFromNotes(notes)
      if (!extracted) {
        skipped++
        results.push({ id: row.id, old: currentTitle, new: null, action: 'no-h1-found' })
        continue
      }

      await sql`
        UPDATE note_sessions
        SET title = ${extracted}
        WHERE id = ${row.id}
      `
      updated++
      results.push({ id: row.id, old: currentTitle, new: extracted, action: 'updated' })
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      updated,
      skipped,
      results,
    })
  } catch (error: any) {
    console.error('[backfill-titles]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
