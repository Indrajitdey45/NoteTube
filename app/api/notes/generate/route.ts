import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateContentWithFallback } from '@/lib/gemini'
import { insertNote } from '@/lib/db'

export const runtime = 'nodejs'

interface TranscriptSegment {
  start: number
  duration: number
  text: string
}

function formatTranscript(segments: TranscriptSegment[], rawTranscript: string): string {
  if (segments && segments.length > 0) {
    return segments
      .map((segment) => {
        const mins = Math.floor(segment.start / 60)
        const secs = String(Math.floor(segment.start % 60)).padStart(2, '0')
        return `[${mins}:${secs}] ${segment.text}`
      })
      .join('\n')
  }
  return rawTranscript
}

function buildNotesPrompt(transcriptText: string, depth: string, language: string, videoTitle?: string) {
  const depthInstruction =
    depth === 'quick'
      ? 'Focus on concise, punchy bullet points, core concepts, and key definitions.'
      : depth === 'very-detailed'
        ? 'Produce an exhaustive, highly detailed study guide. Preserve nearly all lecture concepts, step-by-step mechanisms, formulas, and examples.'
        : 'Produce a comprehensive and detailed study guide covering all topics discussed.'

  const languageInstruction =
    language === 'same' || !language
      ? 'Write in the primary language of the video lecture.'
      : `Write the notes in ${language}.`

  return `You are an elite academic professor, subject matter expert, and master study-guide author.
Your task is to transform this YouTube lecture content into a structured, master-level academic study guide.

${videoTitle ? `VIDEO TITLE: ${videoTitle}\n` : ''}
INSTRUCTIONS:
- ${depthInstruction}
- ${languageInstruction}
- Include accurate timestamp citations (e.g. [03:15]) wherever available from the source.
- Do NOT fabricate or invent facts outside the lecture material.
- Organize clearly with rich Markdown formatting (headings, bullet points, bold key terms, tables, callout blocks, code blocks or formulas where applicable).

STRUCTURE YOUR NOTES AS FOLLOWS:
# 📚 [Lecture Title / Main Subject]
## 🎯 Executive Summary & Big Picture
Brief overview of what this lecture is about and why it matters.

## 🔑 Core Concepts & Terminology
Define all key terms, keywords, and foundational theories introduced.

## 📖 In-Depth Explanations & Step-by-Step Mechanisms
Deep-dive into each topic covered in logical sequence. Break down complex ideas into understandable steps.

## 💡 Practical Examples, Case Studies & Formulas
Include any algorithms, code snippets, mathematical equations, or concrete examples presented.

## ⚖️ Key Comparisons, Trade-offs & Analysis
Compare competing approaches, advantages, disadvantages, and trade-offs.

## 🚀 Practical Applications & Real-World Use Cases
Where and how is this applied in real-world scenarios or industry?

## 📝 High-Yield Exam & Interview Questions
5-8 important conceptual and technical questions based directly on this lecture, with concise model answers.

## 📌 Key Takeaways & Cheat Sheet
Quick bullet-point summary of the most critical points to remember for quick revision.

---
LECTURE CONTENT:
${transcriptText}
`
}

/**
 * Extract the main title from the first H1 heading in the generated notes.
 * Gemini always starts notes with: # 📚 [Actual Subject Title]
 * Falls back to the provided title or a generic label.
 */
function extractTitleFromNotes(notes: string, fallback?: string): string {
  const match = notes.match(/^#\s+(.+)/m)
  if (match) {
    return match[1]
      .replace(/[📚🎯🔑📖💡⚖️🚀📝📌]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  return fallback || 'Untitled Study Guide'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const segments: TranscriptSegment[] = Array.isArray(body?.segments) ? body.segments : []
    let transcript = typeof body?.transcript === 'string' ? body.transcript.trim() : ''
    const videoId = body?.videoId || ''
    const url = body?.url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '')
    const depth = body?.depth || 'detailed'
    const language = body?.language || 'same'
    const title = body?.title || ''

    if (!transcript && segments.length > 0) {
      transcript = segments.map((s) => s.text).join(' ').trim()
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server. Please check your .env.local file.' },
        { status: 503 }
      )
    }

    let notes = ''
    let sourceUsed = 'transcript'

    // Case 1: We have transcript text or segments
    if (transcript) {
      const formattedTranscript = formatTranscript(segments, transcript)
      const prompt = buildNotesPrompt(formattedTranscript, depth, language, title)
      const result = await generateContentWithFallback({ contents: prompt })
      notes = result.text
    } else if (url) {
      // Case 2: No direct transcript, but we have the YouTube video URL
      // Use Gemini's native video understanding via fileData
      sourceUsed = 'video_url'
      const standardUrl = url.startsWith('http') ? url : `https://www.youtube.com/watch?v=${videoId}`
      const prompt = buildNotesPrompt(
        `Please inspect the complete video at this URL: ${standardUrl}`,
        depth,
        language,
        title
      )

      const result = await generateContentWithFallback({
        contents: [
          {
            fileData: {
              fileUri: standardUrl,
              mimeType: 'video/mp4',
            },
          },
          prompt,
        ],
      })
      notes = result.text
    } else {
      return NextResponse.json(
        { error: 'A YouTube URL or lecture transcript is required to generate notes.' },
        { status: 400 }
      )
    }

    if (!notes) {
      return NextResponse.json(
        { error: 'Failed to generate notes from the provided content. Please verify the video and try again.' },
        { status: 500 }
      )
    }

    const words = transcript ? transcript.split(/\s+/).filter(Boolean) : notes.split(/\s+/).filter(Boolean)

    // Persist to Neon DB — attach Clerk userId if user is signed in
    const { userId } = await auth()
    const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
    const resolvedTitle = extractTitleFromNotes(notes, title || undefined)
    await insertNote({
      id: sessionId,
      userId: userId || undefined,
      notes,
      url: url || '',
      title: resolvedTitle,
      videoId: videoId || undefined,
      wordCount: words.length,
      depth,
      language,
      generatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      sessionId,
      videoId,
      notes,
      sourceUsed,
      coverage: {
        transcriptWordCount: words.length,
        transcriptSegmentCount: segments.length || 1,
        chunksProcessed: 1,
        chunksTotal: 1,
        complete: true,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[Notes] Generation failed:', error)
    const message = error?.message || 'Unable to generate complete notes. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
