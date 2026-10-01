import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getRecentNotes, getNoteCount } from '@/lib/db'

export const runtime = 'nodejs'

/** GET /api/dashboard — recent notes + aggregate stats for authenticated user */
export async function GET() {
  try {
    const { userId } = await auth()
    const targetUserId = userId || undefined

    const [recentNotes, totalCount] = await Promise.all([
      getRecentNotes(6, targetUserId),
      getNoteCount(targetUserId),
    ])

    return NextResponse.json({
      stats: {
        totalNotes: totalCount,
        recentCount: recentNotes.length,
      },
      recentNotes,
    })
  } catch (error: any) {
    console.error('[API /dashboard GET]', error)
    return NextResponse.json({ error: error.message ?? 'Failed to load dashboard' }, { status: 500 })
  }
}
