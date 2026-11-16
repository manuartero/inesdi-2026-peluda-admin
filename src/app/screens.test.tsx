import { cleanup, render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { CUSTOMERS } from '@/customers/customers.data.ts'
import { REVIEWS } from '@/reviews/reviews.data.ts'
import { SUPPLIERS } from '@/suppliers/suppliers.data.ts'
import { INBOX } from '@/tickets/tickets.data.ts'
import { APP_ROUTES } from './app.router.tsx'

// Happy-path smoke tests: every screen renders its title and its main content from the real data.

function openPage(path: string) {
  render(<RouterProvider router={createMemoryRouter(APP_ROUTES, { initialEntries: [path] })} />)
}

const pageTitle = () => screen.getByRole('heading', { level: 1 }).textContent

afterEach(cleanup)

describe('screens', () => {
  it('home shows the inbox and review counters', () => {
    openPage('/')
    expect(pageTitle()).toBe('Inicio')
    expect(screen.getByText('Tickets sin clasificar')).toBeTruthy()
    expect(screen.getByText('Reseñas sin responder')).toBeTruthy()
  })

  it('ticket inbox lists every ticket', () => {
    openPage('/tickets')
    expect(pageTitle()).toBe('Bandeja de tickets')
    expect(screen.getAllByRole('row').length).toBeGreaterThan(INBOX.length)
  })

  it('ticket detail shows the message and the copy button', () => {
    const ticket = INBOX[0]
    openPage(`/tickets/${ticket.id}`)
    expect(pageTitle()).toContain(ticket.id)
    expect(screen.getAllByText(ticket.message).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Copiar para el prompt/ })).toBeTruthy()
  })

  it('customer list lists every customer', () => {
    openPage('/customers')
    expect(pageTitle()).toBe('Clientes')
    expect(screen.getAllByRole('row').length).toBeGreaterThan(CUSTOMERS.length)
  })

  it('customer detail shows the customer', () => {
    const customer = CUSTOMERS[0]
    openPage(`/customers/${customer.id}`)
    expect(pageTitle()).toContain(customer.id)
    expect(pageTitle()).toContain(customer.firstName)
  })

  it('supplier list lists every supplier', () => {
    openPage('/suppliers')
    expect(pageTitle()).toBe('Proveedores y contratos')
    for (const supplier of SUPPLIERS) {
      expect(screen.getAllByText(supplier.legalName).length).toBeGreaterThan(0)
    }
  })

  it('supplier detail shows the supplier', () => {
    const supplier = SUPPLIERS[0]
    openPage(`/suppliers/${supplier.id}`)
    expect(pageTitle()).toBe(supplier.legalName)
  })

  it('review list lists every review', () => {
    openPage('/reviews')
    expect(pageTitle()).toBe('Reseñas')
    expect(screen.getAllByRole('row').length).toBeGreaterThan(REVIEWS.length)
  })

  it('review detail shows the review text', () => {
    const review = REVIEWS[0]
    openPage(`/reviews/${review.id}`)
    expect(pageTitle()).toContain(review.id)
    expect(screen.getAllByText(review.text).length).toBeGreaterThan(0)
  })

  it('brand page renders', () => {
    openPage('/brand')
    expect(pageTitle()).toBe('Marca')
  })

  it('an unknown path shows the not-found page', () => {
    openPage('/nope')
    expect(pageTitle()).toBe('Página no encontrada')
  })
})
