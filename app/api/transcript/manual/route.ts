import { NextRequest, NextResponse } from 'next/server'
import {
  parsePlainText,
  calculateWordCount,
  calculateReadingTime,
  validateTranscript,
  NormalizedTranscript,
} from '@/lib/transcript-providers'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript, videoId, title } = body

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
    }

    // Validate content
    if (!validateTranscript(transcript)) {
      return NextResponse.json(
        { error: 'Transcript is too short or empty' },
        { status: 400 }
      )
    }

    // Parse transcript
    const segments = parsePlainText(transcript)
    const wordCount = calculateWordCount(transcript)
    const readingTimeMinutes = calculateReadingTime(wordCount)

    const result: NormalizedTranscript = {
      videoId: videoId || `manual_${Date.now()}`,
      language: 'Unknown',
      languageCode: 'auto',
      wordCount,
      readingTimeMinutes,
      segmentCount: segments.length,
      segments,
      transcript,
      source: 'manual',
      title: title || 'Manual Transcript',
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[Manual Transcript] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process transcript' },
      { status: 500 }
    )
  }
}
