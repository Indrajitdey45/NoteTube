import { ReactNode } from 'react'

interface StatsCardProps {
  icon?: ReactNode
  label: string
  value: string | number
  description?: string
}

export function StatsCard({ icon, label, value, description }: StatsCardProps) {
  return (
    <div className="p-6 rounded-lg border border-border bg-card">
      {icon && (
        <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center text-accent mb-4">
          {icon}
        </div>
      )}
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  )
}
