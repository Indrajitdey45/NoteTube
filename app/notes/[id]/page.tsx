'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  Download,
  ExternalLink,
  Home,
  Layers2,
  List,
  Loader2,
  Moon,
  Plus,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'

interface NoteSession {
  id: string
  notes: string
  url: string
  title?: string
  videoId?: string
  wordCount?: number
  depth?: string
  language?: string
  generatedAt: string
}

function extractHeadings(markdown: string) {
  const lines = markdown.split('\n')
  const headings: { level: number; text: string; slug: string }[] = []
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/)
    if (match) {
      const level = match[1].length
      const text = match[2].replace(/[*_`~]/g, '').replace(/\s*[📚🎯🔑📖💡⚖️🚀📝📌]/g, '').trim()
      const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
      headings.push({ level, text, slug })
    }
  }
  return headings
}

export default function NotesViewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [session, setSession] = useState<NoteSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)

  useEffect(() => {
    if (!id) return

    async function loadNote() {
      try {
        const res = await fetch(`/api/notes/${id}`)
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const data = await res.json()
        if (data.session) {
          setSession(data.session)
        } else {
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadNote()
  }, [id])

  function copyToClipboard() {
    if (!session?.notes) return
    navigator.clipboard.writeText(session.notes)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadMarkdown() {
    if (!session?.notes) return
    const blob = new Blob([session.notes], { type: 'text/markdown;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `notes-${session.videoId || id}.md`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const headings = session ? extractHeadings(session.notes) : []

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-accent" />
          <p className="text-sm">Loading your study guide...</p>
        </div>
      </div>
    )
  }

  if (notFound || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-center px-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <BookOpen className="size-8" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Study guide not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This study guide may have been cleared from storage.
          </p>
        </div>
        <Link href="/create">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="size-4" />
            Generate new notes
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6">
        {/* Left: back + title */}
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/create">
            <button className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors">
              <ArrowLeft className="size-4" />
            </button>
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-6 flex-shrink-0 items-center justify-center rounded bg-accent/20 text-accent">
              <Sparkles className="size-3.5" />
            </div>
            <span className="truncate text-sm font-medium text-foreground">
              {session.title || 'Study Guide'}
            </span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* TOC toggle on mobile */}
          <button
            onClick={() => setTocOpen(!tocOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors lg:hidden"
          >
            <List className="size-3.5" />
            Contents
          </button>

          {session.url && (
            <a
              href={session.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3.5" />
              Source
            </a>
          )}

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span className={copied ? 'text-emerald-500' : ''}>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center size-8 rounded-lg border border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <button
            onClick={downloadMarkdown}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <Download className="size-3.5" />
            Export .md
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-screen-2xl">
        {/* Left Sidebar — Table of Contents */}
        <aside
          className={`
            ${tocOpen ? 'fixed inset-0 top-14 z-40 bg-background' : 'hidden'}
            lg:sticky lg:top-14 lg:block lg:h-[calc(100vh-3.5rem)] lg:w-64 lg:flex-shrink-0 lg:overflow-y-auto
            border-r border-border
          `}
        >
          {/* Mobile close button */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contents</span>
            <button onClick={() => setTocOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>

          <div className="p-4">
            <p className="mb-3 hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">
              Contents
            </p>

            {/* Stats row */}
            <div className="mb-5 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
                <p className="text-lg font-bold text-foreground">{headings.filter(h => h.level === 2).length}</p>
                <p className="text-[10px] text-muted-foreground">Sections</p>
              </div>
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
                <p className="text-lg font-bold text-foreground">{session.wordCount ? Math.round(session.wordCount / 200) : '—'}</p>
                <p className="text-[10px] text-muted-foreground">Min read</p>
              </div>
            </div>

            {/* Heading links */}
            <nav className="flex flex-col gap-0.5">
              {headings.map((h, i) => (
                <a
                  key={i}
                  href={`#heading-${i}`}
                  onClick={() => setTocOpen(false)}
                  className={`
                    block rounded-md px-2.5 py-1.5 text-xs leading-relaxed transition-colors hover:bg-secondary hover:text-foreground
                    ${h.level === 1 ? 'font-semibold text-foreground' : ''}
                    ${h.level === 2 ? 'pl-2.5 text-muted-foreground' : ''}
                    ${h.level === 3 ? 'pl-5 text-muted-foreground/70' : ''}
                  `}
                >
                  {h.text}
                </a>
              ))}
            </nav>

            {/* Bottom actions */}
            <div className="mt-6 flex flex-col gap-2">
              <Link href="/create">
                <button className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors">
                  <Plus className="size-3.5" />
                  New study set
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors">
                  <Home className="size-3.5" />
                  Dashboard
                </button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile TOC overlay backdrop */}
        {tocOpen && (
          <div
            className="fixed inset-0 top-14 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setTocOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
          {/* Meta bar */}
          <div className="mb-8 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {session.url && (
              <a
                href={session.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors truncate max-w-xs"
              >
                <ExternalLink className="size-3 flex-shrink-0" />
                <span className="truncate">{session.url}</span>
              </a>
            )}
            {session.wordCount && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px]">
                ~{session.wordCount} words
              </span>
            )}
            {session.depth && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] capitalize">
                {session.depth} depth
              </span>
            )}
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px]">
              AI-Generated
            </span>
          </div>

          {/* Notes content — inject heading anchors */}
          <NotesWithAnchors notes={session.notes} />

          {/* Bottom CTA */}
          <div className="mt-16 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <Sparkles className="mx-auto mb-3 size-8 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Study these notes?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Generate flashcards or a quiz from this study guide.</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/flashcards">
                <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
                  <Layers2 className="size-4" />
                  Flashcards
                </Button>
              </Link>
              <Link href="/create">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="size-4" />
                  Generate another
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Wraps MarkdownRenderer and injects invisible id anchors before each heading for TOC links.
// Each anchor must be separated by blank lines so remark parses it as an HTML block (not inline).
function NotesWithAnchors({ notes }: { notes: string }) {
  const lines = notes.split('\n')
  let headingIndex = 0
  const processedLines: string[] = []

  for (const line of lines) {
    const isHeading = /^#{1,3}\s+/.test(line)
    if (isHeading) {
      // Add blank line before anchor, anchor on its own line, blank line after, then heading
      processedLines.push('')
      processedLines.push(`<a id="heading-${headingIndex++}"></a>`)
      processedLines.push('')
      processedLines.push(line)
    } else {
      processedLines.push(line)
    }
  }

  return <MarkdownRenderer content={processedLines.join('\n')} />
}
