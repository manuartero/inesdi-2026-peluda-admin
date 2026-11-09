import { CopyPromptButton } from '@/app/copy-prompt-button.component.tsx'
import { MarkdownText } from '@/app/markdown-text.component.tsx'
import { PageHeader } from '@/app/page-header.component.tsx'
import { Card, CardContent } from '@/components/ui/card'
import brandVoice from '../../data/handwritten/brand-voice.md?raw'

export function BrandPage() {
  return (
    <>
      <PageHeader
        title="Marca"
        description="Guía de voz de Peluda, para quien responde a clientes y reseñas."
        actions={<CopyPromptButton text={brandVoice} />}
      />
      <div className="max-w-4xl px-8 py-6">
        <Card>
          <CardContent>
            <MarkdownText markdown={brandVoice} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
