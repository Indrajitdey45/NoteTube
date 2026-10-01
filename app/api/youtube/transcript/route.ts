import { NextRequest, NextResponse } from 'next/server'
import { generateContentWithFallback } from '@/lib/gemini'

export const runtime = 'nodejs'

interface TranscriptSegment {
  start: number
  duration: number
  text: string
}

function extractVideoId(value: string) {
  if (!value) return null
  const trimmed = value.trim()
  if (/^[-\w]{11}$/.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    if (hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null
    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v')
      return url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/)?.[1] ?? null
    }
  } catch {
    return null
  }
  return null
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, code, error: message }, { status })
}

function normalizeSegments(value: unknown): TranscriptSegment[] {
  if (!Array.isArray(value)) return []
  return value.map((segment: any) => ({
    start: Number(segment?.start ?? segment?.start_time ?? segment?.timestamp ?? 0),
    duration: Number(segment?.duration ?? segment?.dur ?? 0),
    text: typeof segment?.text === 'string' ? segment.text.replace(/\s+/g, ' ').trim() : '',
  })).filter((segment) => segment.text)
}

function normalizeResponse(data: any, videoId: string) {
  const rawTranscript = Array.isArray(data?.transcript)
    ? data.transcript
    : Array.isArray(data?.data?.transcript)
      ? data.data.transcript
      : Array.isArray(data?.segments)
        ? data.segments
        : data?.transcript?.segments ?? data?.data?.segments
  const segments = normalizeSegments(rawTranscript)
  const transcript = typeof data?.transcript === 'string'
    ? data.transcript.trim()
    : typeof data?.text === 'string'
      ? data.text.trim()
      : segments.map((segment) => segment.text).join(' ')
  const words = transcript.split(/\s+/).filter(Boolean)
  const metadata = data?.metadata ?? data?.video ?? data?.data?.metadata ?? data?.data?.video ?? {}

  if (!transcript) throw new Error('TranscriptAPI returned no transcript.')
  return {
    videoId,
    title: String(data?.title ?? metadata?.title ?? `YouTube lecture ${videoId}`),
    author: String(data?.author ?? metadata?.author ?? metadata?.channel ?? ''),
    duration: Number(data?.duration ?? metadata?.duration ?? 0),
    language: String(data?.language ?? data?.language_code ?? metadata?.language ?? 'unknown'),
    languageCode: data?.language_code ?? metadata?.language_code,
    segments: segments.length ? segments : [{ start: 0, duration: 0, text: transcript }],
    transcript,
    segmentCount: segments.length || 1,
    wordCount: words.length,
    readingTimeMinutes: Math.max(1, Math.ceil(words.length / 200)),
    source: 'transcriptapi',
  }
}

async function generateTranscriptWithGemini(url: string, videoId: string) {
  if (!process.env.GEMINI_API_KEY) return null
  const standardUrl = `https://www.youtube.com/watch?v=${videoId}`
  try {
    const { text: transcript } = await generateContentWithFallback({
      contents: [
        {
          fileData: {
            fileUri: standardUrl,
            mimeType: 'video/mp4',
          },
        },
        `You are a meticulous transcription assistant. Provide a comprehensive, chronological, and complete transcript or detailed spoken lecture breakdown of everything taught in this YouTube video (${standardUrl}).
Preserve key explanations, concepts, examples, formulas, procedures, and arguments in sequence. Do not omit topics. Return the detailed content.`,
      ],
    })

    const cleaned = transcript.trim()
    if (!cleaned || cleaned.length < 50 || /cannot access|can't access|unable to access|do not have access/i.test(cleaned)) {
      return null
    }

    const words = cleaned.split(/\s+/).filter(Boolean)
    const segments = [{ start: 0, duration: 0, text: cleaned }]
    return {
      videoId,
      title: `YouTube lecture ${videoId}`,
      author: '',
      duration: 0,
      language: 'unknown',
      segments,
      transcript: cleaned,
      segmentCount: 1,
      wordCount: words.length,
      readingTimeMinutes: Math.max(1, Math.ceil(words.length / 200)),
      source: 'gemini',
    }
  } catch (geminiError) {
    console.error('[Gemini transcript fallback error]:', geminiError)
    return null
  }
}

function providerError(status: number) {
  if (status === 401) return ['TRANSCRIPT_API_AUTH', 'Transcript API authentication failed. Check TRANSCRIPT_API_KEY.', 502] as const
  if (status === 402) return ['TRANSCRIPT_API_PLAN', 'Transcript API credits/plan are unavailable.', 402] as const
  if (status === 404) return ['TRANSCRIPT_NOT_FOUND', 'No transcript is available for this video.', 404] as const
  if (status === 429) return ['TRANSCRIPT_API_RATE_LIMIT', 'Transcript API rate limit reached. Please try again later.', 429] as const
  if (status >= 500) return ['TRANSCRIPT_API_UNAVAILABLE', 'Transcript service is temporarily unavailable.', 503] as const
  return ['TRANSCRIPT_API_ERROR', 'TranscriptAPI could not retrieve this transcript.', 502] as const
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = typeof body?.url === 'string' ? body.url.trim() : ''
    const videoId = extractVideoId(input)
    const transcriptApiKey = process.env.TRANSCRIPT_API_KEY

    if (!videoId || !/^[-\w]{11}$/.test(videoId)) return errorResponse('INVALID_URL', 'Enter a valid YouTube video URL.', 400)

    // Prefer TranscriptAPI when configured, but never send the learner to a
    // manual transcript screen just because that provider is unavailable.
    if (transcriptApiKey) {
      const endpoint = new URL('https://api.transcriptapi.io/transcript')
      endpoint.searchParams.set('video_id', videoId)
      const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${transcriptApiKey}`, Accept: 'application/json' }, cache: 'no-store' })
      if (response.ok) {
        const normalized = normalizeResponse(await response.json(), videoId)
        return NextResponse.json({ success: true, ...normalized })
      }
      console.warn('[TranscriptAPI] Provider failed; trying YouTube captions fallback:', response.status)
    }

    // YouTube's caption endpoint is a provider fallback and does not require
    // a second user input. It handles videos with public captions directly.
    try {
      const { YoutubeTranscript } = await import('youtube-transcript')
      const captions = await YoutubeTranscript.fetchTranscript(videoId)
      const segments = normalizeSegments(captions)
      const transcript = segments.map((segment) => segment.text).join(' ').trim()
      if (transcript) {
        const words = transcript.split(/\s+/).filter(Boolean)
        return NextResponse.json({
          success: true,
          videoId,
          title: `YouTube lecture ${videoId}`,
          author: '',
          duration: 0,
          language: 'unknown',
          segments,
          transcript,
          segmentCount: segments.length,
          wordCount: words.length,
          readingTimeMinutes: Math.max(1, Math.ceil(words.length / 200)),
          source: 'youtube',
        })
      }
    } catch (fallbackError) {
      console.error('[YouTube captions] Fallback failed:', fallbackError)
    }

    // Last resort: ask Gemini to inspect the supplied YouTube URL directly. This
    // keeps the URL-only workflow intact when captions are disabled or blocked.
    if (process.env.GEMINI_API_KEY) {
      try {
        const generated = await generateTranscriptWithGemini(input, videoId)
        if (generated) return NextResponse.json({ success: true, ...generated })
      } catch (geminiError) {
        console.error('[Gemini transcript] URL inspection failed:', geminiError)
      }
    }

    return errorResponse('TRANSCRIPT_UNAVAILABLE', 'We could not access the spoken content from this YouTube URL. Please check that the video is public and try again.', 422)
  } catch (error) {
    console.error('[TranscriptAPI] Transcript request failed:', error)
    return errorResponse('TRANSCRIPT_API_ERROR', 'Transcript service is temporarily unavailable.', 502)
  }
}
