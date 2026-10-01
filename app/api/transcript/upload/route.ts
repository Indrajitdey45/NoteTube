import { NextRequest, NextResponse } from 'next/server'
import {
  parseTranscriptFile,
  calculateWordCount,
  calculateReadingTime,
  validateTranscript,
  NormalizedTranscript,
} from '@/lib/transcript-providers'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const videoId = formData.get('videoId') as string
    const title = formData.get('title') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedExtensions = ['txt', 'vtt', 'srt']
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!allowedExtensions.includes(extension || '')) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: TXT, VTT, SRT' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 5MB' }, { status: 400 })
    }

    // Read file content
    const content = await file.text()

    // Parse transcript
    const { segments, transcript } = parseTranscriptFile(content, file.name)

    // Validate content
    if (!validateTranscript(transcript)) {
      return NextResponse.json(
        { error: 'Transcript is too short or empty' },
        { status: 400 }
      )
    }

    const wordCount = calculateWordCount(transcript)
    const readingTimeMinutes = calculateReadingTime(wordCount)

    const result: NormalizedTranscript = {
      videoId: videoId || `upload_${Date.now()}`,
      language: 'Unknown',
      languageCode: 'auto',
      wordCount,
      readingTimeMinutes,
      segmentCount: segments.length,
      segments,
      transcript,
      source: 'upload',
      title: title || file.name,
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[Transcript Upload] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process transcript file' },
      { status: 500 }
    )
  }
}
