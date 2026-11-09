import { createBrowserRouter } from 'react-router'
import { HomePage } from '@/home/home.page.tsx'
import { TicketDetailPage } from '@/tickets/ticket-detail.page.tsx'
import { TicketInboxPage } from '@/tickets/ticket-inbox.page.tsx'
import { AppLayout } from './app-layout.component.tsx'
import { APP_NAV } from './app-nav.ts'
import { ComingSoonPage } from './coming-soon.page.tsx'
import { NotFoundPage } from './not-found.page.tsx'

const comingSoonRoutes = APP_NAV.filter((entry) => entry.comingSoon).map((entry) => ({
  path: entry.path,
  element: <ComingSoonPage title={entry.label} />,
}))

export const APP_ROUTER = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/tickets', element: <TicketInboxPage /> },
      { path: '/tickets/:ticketId', element: <TicketDetailPage /> },
      ...comingSoonRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
