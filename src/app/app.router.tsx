import { createBrowserRouter } from 'react-router'
import { BrandPage } from '@/brand/brand.page.tsx'
import { HomePage } from '@/home/home.page.tsx'
import { ReviewDetailPage } from '@/reviews/review-detail.page.tsx'
import { ReviewListPage } from '@/reviews/review-list.page.tsx'
import { SupplierDetailPage } from '@/suppliers/supplier-detail.page.tsx'
import { SupplierListPage } from '@/suppliers/supplier-list.page.tsx'
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
      { path: '/suppliers', element: <SupplierListPage /> },
      { path: '/suppliers/:supplierId', element: <SupplierDetailPage /> },
      { path: '/reviews', element: <ReviewListPage /> },
      { path: '/reviews/:reviewId', element: <ReviewDetailPage /> },
      { path: '/brand', element: <BrandPage /> },
      ...comingSoonRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
