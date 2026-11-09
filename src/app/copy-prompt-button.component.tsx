import { Check, Copy, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const FEEDBACK_MS = 2000

type CopyStatus = 'idle' | 'copied' | 'failed'

export function CopyPromptButton({ text }: { text: string }) {
  const [status, setStatus] = useState<CopyStatus>('idle')

  useEffect(() => {
    if (status === 'idle') {
      return
    }
    const timer = setTimeout(() => setStatus('idle'), FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [status])

  // The clipboard API needs a secure context and the page focus: on failure, say so instead of pretending.
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <Button onClick={copy}>
      {status === 'idle' && <Copy />}
      {status === 'copied' && <Check />}
      {status === 'failed' && <X />}
      {status === 'idle' && 'Copiar para el prompt'}
      {status === 'copied' && 'Copiado'}
      {status === 'failed' && 'No se pudo copiar'}
    </Button>
  )
}
