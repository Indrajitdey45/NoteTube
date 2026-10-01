'use client'

import { useEffect, useState } from 'react'
import { AppShell, PageHeader } from '@/components/app-shell'
import { NoteCard } from '@/components/note-card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface NoteSession {
  id: string
  title?: string
  url: string
  generatedAt: string
  wordCount?: number
  depth?: string
  language?: string
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

type Filter = 'all' | 'recent'

export default function LibraryPage() {
  const [notes, setNotes] = useState<NoteSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/notes')
        if (res.ok) {
          const data = await res.json()
          setNotes(data.notes ?? [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const displayed = filter === 'recent'
    ? notes.filter(n => Date.now() - new Date(n.generatedAt).getTime() < 7 * 24 * 3600 * 1000)
    : notes

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Library"
        title="My notes"
        description="Everything you have turned into a study set."
        action={
          <Link href="/create">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Create Notes</Button>
          </Link>
        }
      />
      <div className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            onClick={() => setFilter('all')}
          >
            All notes {!loading && `(${notes.length})`}
          </Button>
          <Button
            variant={filter === 'recent' ? 'secondary' : 'ghost'}
            onClick={() => setFilter('recent')}
          >
            Last 7 days
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-accent" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-sm text-muted-foreground">
              {filter === 'recent' ? 'No notes created this week.' : 'No notes yet — generate your first one!'}
            </p>
            <Link href="/create">
              <Button variant="outline" size="sm">Create your first note</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayed.map((note) => (
              <NoteCard
                key={note.id}
                id={note.id}
                title={note.title || 'Untitled Study Guide'}
                source="YouTube"
                date={timeAgo(note.generatedAt)}
                topics={[]}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
