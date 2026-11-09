import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { APP_ROUTER } from './app/app.router.tsx'
import './index.css'

const root = document.getElementById('root')

if (root) {
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={APP_ROUTER} />
    </StrictMode>,
  )
}
