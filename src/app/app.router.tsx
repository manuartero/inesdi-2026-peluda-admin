import { createBrowserRouter } from 'react-router'
import { BrandPage } from '@/brand/brand.page.tsx'
import { CustomerDetailPage } from '@/customers/customer-detail.page.tsx'
import { CustomerListPage } from '@/customers/customer-list.page.tsx'
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

// Exported apart from the router so the tests can mount them in a memory router.
export const APP_ROUTES = [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/tickets', element: <TicketInboxPage /> },
      { path: '/tickets/:ticketId', element: <TicketDetailPage /> },
      { path: '/customers', element: <CustomerListPage /> },
      { path: '/customers/:customerId', element: <CustomerDetailPage /> },
      { path: '/suppliers', element: <SupplierListPage /> },
      { path: '/suppliers/:supplierId', element: <SupplierDetailPage /> },
      { path: '/reviews', element: <ReviewListPage /> },
      { path: '/reviews/:reviewId', element: <ReviewDetailPage /> },
      { path: '/brand', element: <BrandPage /> },
      ...comingSoonRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const APP_ROUTER = createBrowserRouter(APP_ROUTES)
