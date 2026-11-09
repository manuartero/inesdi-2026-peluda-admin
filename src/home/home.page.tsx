import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/app/page-header.component.tsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HANDWRITTEN } from '@/data/handwritten.data.ts'
import { formatLongDate } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import { COUNTRIES, REFERENCE_DATE } from '@/data/model.types.ts'
import { UNANSWERED } from '@/reviews/reviews.data.ts'
import { UNCLASSIFIED_TODAY } from '@/tickets/tickets.data.ts'

const { company } = HANDWRITTEN

// 'always' groups 4-digit figures too, so 4.000 lines up with 10.000 in the country list.
const formatNumber = (value: number) => value.toLocaleString('es-ES', { useGrouping: 'always' })

const totalSubscribers = COUNTRIES.reduce((total, country) => total + company.subscribers[country], 0)

function Kpi({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
      </CardHeader>
      {detail && <CardContent className="text-xs text-muted-foreground">{detail}</CardContent>}
    </Card>
  )
}

function SubscribersByCountry() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Suscriptores por país</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          {COUNTRIES.map((country) => (
            <div key={country} className="flex justify-between">
              <dt>{LABELS.country[country]}</dt>
              <dd className="tabular-nums">{formatNumber(company.subscribers[country])}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

function TodayCard({ to, label, count, detail }: { to: string; label: string; count: number; detail: string }) {
  return (
    <Link to={to} className="group block">
      <Card className="transition-colors group-hover:bg-muted/40">
        <CardHeader>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="flex items-center justify-between text-3xl font-semibold tabular-nums">
            {count}
            <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">{detail}</CardContent>
      </Card>
    </Link>
  )
}

export function HomePage() {
  return (
    <>
      <PageHeader title="Inicio" description={<span className="first-letter:uppercase">{formatLongDate(REFERENCE_DATE)}</span>} />
      <div className="space-y-8 px-8 py-6">
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Hoy</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <TodayCard
              to="/tickets"
              label="Tickets sin clasificar hoy"
              count={UNCLASSIFIED_TODAY.length}
              detail={`Media diaria: unos ${formatNumber(company.ticketsPerDay)} tickets.`}
            />
            <TodayCard
              to="/reviews?status=unanswered"
              label="Reseñas sin responder"
              count={UNANSWERED.length}
              detail={`Solo se responde el ${company.reviewsAnsweredPct} % de las reseñas.`}
            />
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Indicadores</h2>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Kpi label="Suscriptores activos" value={formatNumber(totalSubscribers)} detail="En cinco países" />
              <Kpi
                label="Primera respuesta (media)"
                value={`${company.firstResponseHours.current} h`}
                detail={`Objetivo: ${company.firstResponseHours.target} h`}
              />
              <Kpi label="Bajas mensuales" value={`${formatNumber(company.monthlyChurnPct)} %`} />
              <Kpi label="Valoración media" value={`${formatNumber(company.averageRating)} / 5`} />
              <Kpi
                label="Reseñas respondidas"
                value={`${company.reviewsAnsweredPct} %`}
                detail={`De unas ${formatNumber(company.reviewsPerMonth)} reseñas al mes`}
              />
              <Kpi label="Facturación anual" value={`${formatNumber(company.annualRevenueEur / 1_000_000)} M€`} />
            </div>
            <SubscribersByCountry />
          </div>
        </section>
      </div>
    </>
  )
}
