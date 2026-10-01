'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell, PageHeader } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check, FileText, Link2, Loader2, Sparkles } from 'lucide-react'
import { TranscriptFallback } from '@/components/transcript-fallback'
import Link from 'next/link'

type Stage = 'idle' | 'transcript' | 'notes' | 'redirecting' | 'error' | 'fallback'

const stages = [
  'Validating YouTube URL',
  'Connecting to video source',
  'Extracting video captions',
  'Processing lecture content',
  'Structuring key academic concepts',
  'Analyzing formulas and explanations',
  'Generating master study guide with AI',
  'Finalizing notes and exam questions',
  'Opening full-screen study guide...',
]


export default function CreatePage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [depth, setDepth] = useState('detailed')
  const [language, setLanguage] = useState('same')
  const [stage, setStage] = useState<Stage>('idle')
  const [currentStage, setCurrentStage] = useState(0)
  const [error, setError] = useState('')

  async function generateNotes(payload: any) {
    try {
      setStage('notes')
      setCurrentStage(5)

      const notesResponse = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, url, depth, language }),
      })
      const notesData = await notesResponse.json()

      if (!notesResponse.ok) {
        throw new Error(notesData.error || 'Unable to generate notes right now.')
      }

      setCurrentStage(8)
      setStage('redirecting')

      // Navigate using the sessionId returned by the API (saved in Neon DB)
      const sessionId = notesData.sessionId
      router.push(`/notes/${sessionId}`)
    } catch (caught) {
      setStage('error')
      setError(caught instanceof Error ? caught.message : 'Unable to generate notes.')
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!url.trim()) return

    setError('')
    setStage('transcript')
    setCurrentStage(0)

    try {
      setCurrentStage(1)
      const transcriptResponse = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const transcriptData = await transcriptResponse.json()

      if (transcriptResponse.ok && (transcriptData.transcript || transcriptData.segments?.length)) {
        setCurrentStage(3)
        await generateNotes(transcriptData)
      } else {
        // Fallback: generate directly from video URL using Gemini video understanding
        setCurrentStage(4)
        await generateNotes({ url, depth, language })
      }
    } catch {
      // If transcript endpoint fails, still attempt direct AI generation from video URL
      try {
        setCurrentStage(4)
        await generateNotes({ url, depth, language })
      } catch (innerErr) {
        setStage('error')
        setError(innerErr instanceof Error ? innerErr.message : 'Unable to process this video.')
      }
    }
  }

  function handleManualTranscript(transcript: any) {
    generateNotes(transcript)
  }

  const isGenerating = stage === 'transcript' || stage === 'notes' || stage === 'redirecting'

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI Study Assistant"
        title="Create complete lecture notes."
        description="Paste any YouTube lecture URL. NoteTube AI analyzes the full video and produces a master-level study guide."
      />

      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_300px]">
        {/* Main form card */}
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Link2 className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Video source</h2>
              <p className="text-sm text-muted-foreground">
                We analyze the full lecture content — not a short excerpt.
              </p>
            </div>
          </div>

          {stage !== 'fallback' && (
            <>
              {/* URL input */}
              <label htmlFor="video-url" className="mt-8 block text-sm font-medium text-foreground">
                YouTube URL
              </label>
              <input
                id="video-url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="mt-2 h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isGenerating}
              />

              {/* Options */}
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-medium text-foreground">
                  Note depth
                  <select
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    disabled={isGenerating}
                    className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal"
                  >
                    <option value="quick">Quick — key points only</option>
                    <option value="detailed">Detailed — comprehensive (recommended)</option>
                    <option value="very-detailed">Very Detailed — exhaustive guide</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-foreground">
                  Output language
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isGenerating}
                    className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal"
                  >
                    <option value="same">Same as video</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </label>
              </div>

              {/* Feature grid */}
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  'Complete lecture notes',
                  'Core concepts & terminology',
                  'Practical examples & formulas',
                  'Exam & interview questions',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3 text-sm text-muted-foreground"
                  >
                    <Check className="size-4 flex-shrink-0 text-accent" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Progress tracker */}
              {stage !== 'idle' && stage !== 'error' && (
                <div className="mt-8 rounded-xl border border-border bg-background p-5">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-foreground">
                      {stage === 'redirecting'
                        ? '✨ Opening your study guide...'
                        : stages[currentStage] || 'Processing...'}
                    </span>
                    <Loader2 className="size-4 animate-spin text-accent" />
                  </div>
                  <div className="mt-4 flex flex-col gap-1.5 text-xs text-muted-foreground">
                    {stages.slice(0, 8).map((item, index) => (
                      <div
                        key={item}
                        className={`flex items-center gap-2 transition-colors ${
                          index <= currentStage ? 'font-medium text-foreground' : ''
                        }`}
                      >
                        <span className={`size-1.5 rounded-full flex-shrink-0 ${
                          index <= currentStage ? 'bg-accent' : 'bg-muted'
                        }`} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isGenerating}
                className="mt-8 h-12 w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold transition disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {stage === 'redirecting' ? 'Opening study guide...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    Generate complete study guide <ArrowRight className="size-5" />
                  </>
                )}
              </Button>
            </>
          )}

          {stage === 'fallback' && (
            <>
              <TranscriptFallback onTranscriptSubmitted={handleManualTranscript} isLoading={false} />
              <Button
                onClick={() => setStage('idle')}
                variant="outline"
                className="mt-6 w-full"
              >
                Back to URL entry
              </Button>
            </>
          )}

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Powered by NoteTube AI • Notes open in full-screen view
          </p>
        </form>

        {/* Sidebar info */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <Sparkles className="size-5 text-accent" />
            <h2 className="mt-4 font-semibold text-foreground">Built for full lectures</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              NoteTube AI watches, reads, and synthesizes your entire lecture into a structured academic study guide with definitions, examples, comparisons, and exam questions.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <FileText className="size-5" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">See an example</p>
            <p className="mt-1 text-xs text-muted-foreground">Check what a full-screen study guide looks like.</p>
            <Link href="/notes/operating-systems" className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline">
              Open sample notes <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground">What you get</h3>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {[
                '📚 Full-screen reading view',
                '📋 Table of contents sidebar',
                '🔑 Core concepts & terminology',
                '💡 Examples & formulas',
                '📝 Exam questions & answers',
                '📌 Key takeaways cheat sheet',
                '⬇️ Export as Markdown',
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  )
}
