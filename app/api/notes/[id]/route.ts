import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getNoteById, deleteNoteById } from '@/lib/db'

export const runtime = 'nodejs'

/** GET /api/notes/[id] — fetch a single note session */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    const session = await getNoteById(id, userId || undefined)
    if (!session) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }
    return NextResponse.json({ session })
  } catch (error: any) {
    console.error('[API /notes/[id] GET]', error)
    return NextResponse.json({ error: error.message ?? 'Failed to fetch note' }, { status: 500 })
  }
}

/** DELETE /api/notes/[id] — permanently delete a note */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    const deleted = await deleteNoteById(id, userId || undefined)
    if (!deleted) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 })
    }
    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    console.error('[API /notes/[id] DELETE]', error)
    return NextResponse.json({ error: error.message ?? 'Failed to delete note' }, { status: 500 })
  }
}
