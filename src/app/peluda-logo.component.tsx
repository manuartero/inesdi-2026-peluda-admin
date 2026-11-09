import { PawPrint } from 'lucide-react'

export function PeludaLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
        <PawPrint className="size-4.5" strokeWidth={2.25} />
      </div>
      <div className="leading-tight">
        <div className="font-semibold tracking-tight">Peluda</div>
        <div className="text-xs text-muted-foreground">Admin</div>
      </div>
    </div>
  )
}
