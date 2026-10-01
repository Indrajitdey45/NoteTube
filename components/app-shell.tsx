'use client'

import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex">
        <div className="flex-1 flex min-w-0">
          <Sidebar />
          <main className="min-w-0 flex-1 flex flex-col bg-background">{children}</main>
        </div>
      </div>
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-5 border-b border-border px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  )
}

export function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="my-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">{value}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}
