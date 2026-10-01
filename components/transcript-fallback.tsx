'use client'

import { FormEvent, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, FileUp, Copy, Check } from 'lucide-react'

interface TranscriptFallbackProps {
  onTranscriptSubmitted?: (transcript: any) => void
  isLoading?: boolean
}

type FallbackMode = 'prompt' | 'paste' | 'upload'

export function TranscriptFallback({ onTranscriptSubmitted, isLoading = false }: TranscriptFallbackProps) {
  const [mode, setMode] = useState<FallbackMode>('prompt')
  const [pastedText, setPastedText] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePasteSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!pastedText.trim()) {
      setError('Please paste a transcript')
      return
    }

    try {
      const response = await fetch('/api/transcript/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: pastedText,
          videoId: `manual_${Date.now()}`,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to process transcript')

      onTranscriptSubmitted?.(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process transcript')
    }
  }

  async function handleFileUpload(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!uploadedFile) {
      setError('Please select a file')
      return
    }

    const formData = new FormData()
    formData.append('file', uploadedFile)
    formData.append('videoId', `upload_${Date.now()}`)
    formData.append('title', uploadedFile.name)

    try {
      const response = await fetch('/api/transcript/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to process file')

      onTranscriptSubmitted?.(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!['txt', 'vtt', 'srt'].includes(ext || '')) {
        setError('Supported formats: TXT, VTT, SRT')
        setUploadedFile(null)
      } else {
        setError('')
        setUploadedFile(file)
      }
    }
  }

  function copyHowTo() {
    const text =
      'To get the transcript:\n1. Go to YouTube and open your video\n2. Click the three dots menu\n3. Click "Show transcript"\n4. Click the three dots in the transcript panel\n5. Click "Copy transcript"\n6. Paste it here'
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-8 space-y-6 border border-border bg-background p-6 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-orange-500 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-foreground">Automatic transcript unavailable</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            YouTube is currently requiring additional verification for automated caption access. You can paste or upload the transcript instead.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            setMode('paste')
            setError('')
          }}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'paste'
              ? 'bg-accent text-accent-foreground'
              : 'bg-accent/10 text-accent hover:bg-accent/20'
          }`}
        >
          Paste text
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('upload')
            setError('')
          }}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'upload'
              ? 'bg-accent text-accent-foreground'
              : 'bg-accent/10 text-accent hover:bg-accent/20'
          }`}
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={copyHowTo}
          className="px-3 py-2 text-sm font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'How to'}</span>
        </button>
      </div>

      {mode === 'paste' && (
        <div className="space-y-3">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your YouTube transcript here... (Minimum 100 words)"
            className="w-full h-32 border border-input bg-background px-3 py-2 text-sm rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="button"
            onClick={() => void handlePasteSubmit({ preventDefault() {} } as FormEvent)}
            disabled={isLoading || !pastedText.trim()}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isLoading ? 'Processing...' : 'Use this transcript'}
          </Button>
        </div>
      )}

      {mode === 'upload' && (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/5 transition-colors cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.vtt,.srt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <FileUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">
                {uploadedFile ? uploadedFile.name : 'Click to select file'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">TXT, VTT, or SRT (max 5MB)</p>
            </button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="button"
            onClick={() => void handleFileUpload({ preventDefault() {} } as FormEvent)}
            disabled={isLoading || !uploadedFile}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isLoading ? 'Processing...' : 'Upload transcript'}
          </Button>
        </div>
      )}
    </div>
  )
}
