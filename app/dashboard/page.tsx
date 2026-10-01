'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell, PageHeader, Stat } from '@/components/app-shell'
import { NoteCard } from '@/components/note-card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock3, Layers3, Loader2, PlayCircle } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

interface NoteSession {
  id: string
  title?: string
  url: string
  generatedAt: string
  wordCount?: number
  depth?: string
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function extractTopics(notes: string): string[] {
  // Pull the first few heading-2 words as pseudo topics
  const matches = [...notes.matchAll(/^##\s+[^\n]+/gm)].slice(0, 3)
  return matches.map((m) =>
    m[0]
      .replace(/^##\s+/, '')
      .replace(/[📚🎯🔑📖💡⚖️🚀📝📌]/g, '')
      .trim()
      .slice(0, 20)
  )
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<NoteSession[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { user } = useUser()

  useEffect(() => { setMounted(true) }, [])

  const greeting = mounted && user?.firstName ? `Good to see you, ${user.firstName}.` : 'Dashboard'

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard')
        if (res.ok) {
          const data = await res.json()
          setNotes(data.recentNotes ?? [])
          setTotalCount(data.stats?.totalNotes ?? 0)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <AppShell>
      <PageHeader
        eyebrow="Overview"
        title={greeting}
        description="Your recent notes and study activity."
        action={
          <Link href="/create">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <PlayCircle data-icon="inline-start" /> Create Notes
            </Button>
          </Link>
        }
      />
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-8 sm:px-8">
        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Notes created" value={String(totalCount)} detail="Total study guides" />
          <Stat label="Recent (7d)" value={String(notes.filter(n => {
            const d = Date.now() - new Date(n.generatedAt).getTime()
            return d < 7 * 24 * 3600 * 1000
          }).length)} detail="Notes this week" />
          <Stat label="Videos processed" value={String(totalCount)} detail="YouTube lectures" />
          <Stat label="Latest" value={notes[0] ? timeAgo(notes[0].generatedAt) : '—'} detail="Most recent note" />
        </section>

        <section className="grid gap-8 xl:grid-cols-[1fr_320px]">
          {/* Recent notes */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Your library</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Recent notes</h2>
              </div>
              <Link href="/library" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                View all <ArrowRight data-icon="inline-end" />
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-6 animate-spin text-accent" />
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
                <p className="text-sm text-muted-foreground">No notes yet — generate your first one!</p>
                <Link href="/create">
                  <Button variant="outline" size="sm">Get started</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {notes.slice(0, 6).map((note) => (
                  <NoteCard
                    key={note.id}
                    id={note.id}
                    title={note.title || 'Untitled Study Guide'}
                    source="YouTube"
                    date={timeAgo(note.generatedAt)}
                    topics={[]}
                    onDelete={(deletedId) => {
                      setNotes((prev) => prev.filter((n) => n.id !== deletedId))
                      setTotalCount((prev) => Math.max(0, prev - 1))
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Today's focus sidebar */}
          <aside className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Today&apos;s focus</p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">Make space for recall.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Review your recent notes before starting a new video. Small, consistent sessions compound.
              </p>
              <div className="mt-6 flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Layers3 className="size-4 text-accent" /> Total notes
                  </span>
                  <strong className="text-foreground font-semibold">{totalCount}</strong>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="size-4 text-accent" /> This week
                  </span>
                  <strong className="text-foreground font-semibold">
                    {notes.filter(n => Date.now() - new Date(n.generatedAt).getTime() < 7 * 24 * 3600 * 1000).length}
                  </strong>
                </div>
              </div>
            </div>
            <Link href="/library" className="mt-6">
              <Button variant="outline" className="w-full">View all notes</Button>
            </Link>
          </aside>
        </section>
      </div>
    </AppShell>
  )
}
