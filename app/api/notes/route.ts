import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAllNotes } from '@/lib/db'

export const runtime = 'nodejs'

/** GET /api/notes — returns notes for the authenticated user */
export async function GET() {
  try {
    const { userId } = await auth()
    const notes = await getAllNotes(userId || undefined)
    const count = notes.length
    return NextResponse.json({ notes, count })
  } catch (error: any) {
    console.error('[API /notes GET]', error)
    return NextResponse.json({ error: error.message ?? 'Failed to fetch notes' }, { status: 500 })
  }
}
