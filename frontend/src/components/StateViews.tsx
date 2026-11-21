/** Loading / error / empty views every page can reuse. DHIA owns this file; A and B import it. */
import { AlertCircle, Inbox, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner />
    </div>
  )
}

export function ErrorView({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="border-destructive/30 bg-destructive/5 text-destructive flex flex-col items-center gap-3 rounded-xl border p-6 text-center text-sm">
      <AlertCircle className="size-5" />
      <p>{error.message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function EmptyView({ text }: { text: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm">
      <Inbox className="size-5" />
      <p>{text}</p>
    </div>
  )
}
