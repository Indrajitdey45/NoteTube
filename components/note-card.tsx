'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface NoteCardProps {
  id: string
  title: string
  source: string
  date: string
  topics: string[]
  sections?: number
  concepts?: number
  questions?: number
  onDelete?: (id: string) => void
}

export function NoteCard({ id, title, source, date, topics, sections, concepts, questions, onDelete }: NoteCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    try {
      setDeleting(true)
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete?.(id)
      }
    } finally {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <div className="p-5 rounded-lg border border-border bg-card hover:border-accent/50 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-3 gap-2">
            <h3 className="font-semibold text-foreground line-clamp-2 flex-1">{title}</h3>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowConfirm(true)
                }}
                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
                title="Delete permanently"
                aria-label="Delete note permanently"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span>{source}</span>
            <span>{date}</span>
          </div>

          {(sections || concepts || questions) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              {sections && <span>{sections} sections</span>}
              {concepts && <span>{concepts} concepts</span>}
              {questions && <span>{questions} questions</span>}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {topics.map((topic) => (
              <span
                key={topic}
                className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        <Link href={`/notes/${id}`}>
          <Button size="sm" variant="outline" className="w-full">
            Open Notes
          </Button>
        </Link>
      </div>

      {/* Custom styled confirmation modal (replaces ugly browser popup) */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-red-500/10 text-red-500 mb-4">
              <Trash2 className="size-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Delete Study Guide</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-foreground font-medium">&quot;{title}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Deleting...' : 'Delete permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
