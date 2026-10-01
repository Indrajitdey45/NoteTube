// Normalized transcript format used throughout the application
export interface TranscriptSegment {
  start: number
  duration: number
  text: string
}

export interface NormalizedTranscript {
  videoId: string
  language: string
  languageCode?: string
  duration?: number
  wordCount?: number
  readingTimeMinutes?: number
  segmentCount: number
  segments: TranscriptSegment[]
  transcript: string
  source: 'youtube' | 'manual' | 'upload'
  title?: string
}

export interface TranscriptProviderError {
  code: string
  message: string
  isRetryable: boolean
}

// Parse VTT (WebVTT) format
export function parseVTT(content: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = []
  const lines = content.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    i++

    // Skip WEBVTT header and notes
    if (line.startsWith('WEBVTT') || line.startsWith('NOTE') || !line) continue

    // Look for timestamp line (HH:MM:SS.mmm --> HH:MM:SS.mmm)
    const timeMatch = line.match(/(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})/)
    if (!timeMatch) continue

    const startHours = parseInt(timeMatch[1], 10)
    const startMinutes = parseInt(timeMatch[2], 10)
    const startSeconds = parseInt(timeMatch[3], 10)
    const startMs = parseInt(timeMatch[4], 10)

    const endHours = parseInt(timeMatch[5], 10)
    const endMinutes = parseInt(timeMatch[6], 10)
    const endSeconds = parseInt(timeMatch[7], 10)
    const endMs = parseInt(timeMatch[8], 10)

    const start = startHours * 3600 + startMinutes * 60 + startSeconds + startMs / 1000
    const end = endHours * 3600 + endMinutes * 60 + endSeconds + endMs / 1000
    const duration = end - start

    // Collect text lines until next timestamp or empty line
    const textLines: string[] = []
    while (i < lines.length) {
      const nextLine = lines[i].trim()
      if (!nextLine || nextLine.match(/(\d{1,2}):(\d{2}):(\d{2})/)) break
      textLines.push(nextLine.replace(/<[^>]*>/g, '').trim()) // Remove HTML tags
      i++
    }

    const text = textLines.join(' ').replace(/\s+/g, ' ').trim()
    if (text) {
      segments.push({ start, duration, text })
    }
  }

  return segments
}

// Parse SRT (SubRip) format
export function parseSRT(content: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = []
  const entries = content.split(/\n\s*\n/)

  for (const entry of entries) {
    const lines = entry.trim().split('\n')
    if (lines.length < 3) continue

    // Skip sequence number
    const timeLine = lines[1]
    const timeMatch = timeLine.match(/(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})/)
    if (!timeMatch) continue

    const startHours = parseInt(timeMatch[1], 10)
    const startMinutes = parseInt(timeMatch[2], 10)
    const startSeconds = parseInt(timeMatch[3], 10)
    const startMs = parseInt(timeMatch[4], 10)

    const endHours = parseInt(timeMatch[5], 10)
    const endMinutes = parseInt(timeMatch[6], 10)
    const endSeconds = parseInt(timeMatch[7], 10)
    const endMs = parseInt(timeMatch[8], 10)

    const start = startHours * 3600 + startMinutes * 60 + startSeconds + startMs / 1000
    const end = endHours * 3600 + endMinutes * 60 + endSeconds + endMs / 1000
    const duration = end - start

    // Collect text lines
    const textLines = lines.slice(2).filter((line) => line.trim())
    const text = textLines.join(' ').replace(/\s+/g, ' ').trim()
    if (text) {
      segments.push({ start, duration, text })
    }
  }

  return segments
}

// Parse plain text transcript (no timestamps)
export function parsePlainText(content: string): TranscriptSegment[] {
  const lines = content.split('\n').filter((line) => line.trim())
  const segments: TranscriptSegment[] = []
  let currentSegment = ''
  let segmentIndex = 0

  for (const line of lines) {
    currentSegment += (currentSegment ? ' ' : '') + line.trim()

    // Create segments roughly every 100 words or paragraph
    if (currentSegment.split(/\s+/).length >= 50) {
      segments.push({
        start: segmentIndex * 2,
        duration: 2,
        text: currentSegment.trim(),
      })
      currentSegment = ''
      segmentIndex++
    }
  }

  if (currentSegment.trim()) {
    segments.push({
      start: segmentIndex * 2,
      duration: 2,
      text: currentSegment.trim(),
    })
  }

  return segments.length === 0
    ? [
        {
          start: 0,
          duration: 0,
          text: content.replace(/\s+/g, ' ').trim(),
        },
      ]
    : segments
}

// Clean and normalize transcript text
export function cleanTranscript(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\r\n]+/g, ' ') // Remove line breaks
    .trim()
}

// Parse transcript from file based on extension
export function parseTranscriptFile(
  content: string,
  filename: string
): { segments: TranscriptSegment[]; transcript: string } {
  const extension = filename.split('.').pop()?.toLowerCase() || 'txt'
  let segments: TranscriptSegment[] = []

  if (extension === 'vtt') {
    segments = parseVTT(content)
  } else if (extension === 'srt') {
    segments = parseSRT(content)
  } else {
    segments = parsePlainText(content)
  }

  const transcript = segments.map((s) => s.text).join(' ')

  return { segments, transcript }
}

// Calculate word count
export function calculateWordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

// Calculate reading time in minutes
export function calculateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200))
}

// Validate that transcript has meaningful content
export function validateTranscript(transcript: string, minWords: number = 100): boolean {
  const wordCount = calculateWordCount(transcript)
  return wordCount >= minWords
}
