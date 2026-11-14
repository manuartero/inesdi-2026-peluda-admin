import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadFile } from '@/lib/csv.ts'

type DownloadButtonProps = { label: string; fileName: string; type: string; content: () => string }

// `content` is built on click: a 625-row CSV has no business being rebuilt on every render.
export function DownloadButton({ label, fileName, type, content }: DownloadButtonProps) {
  const download = () => downloadFile({ fileName, content: content(), type })
  return (
    <Button variant="outline" onClick={download}>
      <Download />
      {label}
    </Button>
  )
}

const CSV_TYPE = 'text/csv;charset=utf-8'

export function ExportCsvButton({ count, fileName, csv }: { count: number; fileName: string; csv: () => string }) {
  return <DownloadButton label={`Exportar CSV · ${count}`} fileName={fileName} type={CSV_TYPE} content={csv} />
}
