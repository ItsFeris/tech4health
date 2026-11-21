/**
 * Temporary "to build" page. DHIA ONLY.
 * A and B: replace the WHOLE content of your page file with your real screen; don't edit this component.
 */
import { useAsync } from '@/hooks/useAsync'
import { USE_MOCKS } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorView, Spinner } from './StateViews'

interface Props {
  owner: 'A' | 'B'
  title: string
  file: string
  todo: string[]
  apis: string[]
  preview?: () => Promise<unknown>
}

export function Placeholder({ owner, title, file, todo, apis, preview }: Props) {
  const { data, error, loading, reload } = useAsync(preview ?? (async () => null), [])
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{title}</CardTitle>
            <Badge variant="secondary">to build by {owner}</Badge>
          </div>
          <CardDescription>
            File: <code>{file}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div>
            <p className="mb-1 font-medium">What this screen does</p>
            <ul className="text-muted-foreground list-disc pl-5">
              {todo.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 font-medium">Functions to use (from @/api)</p>
            <ul className="list-disc pl-5 font-mono text-xs">
              {apis.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data preview ({USE_MOCKS ? 'mock data' : 'real backend'})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Spinner /> : error ? <ErrorView error={error} onRetry={reload} /> : <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 text-xs">{JSON.stringify(data, null, 2)}</pre>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
