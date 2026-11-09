import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

const DATA_JSON = /\/data\/(handwritten|generated)\/[^/]+\.json$/

function withoutAnswerKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(withoutAnswerKeys)
  }
  if (typeof value !== 'object' || value === null) {
    return value
  }
  const entries = Object.entries(value).filter(([key]) => key !== 'answerKey')
  return Object.fromEntries(entries.map(([key, child]) => [key, withoutAnswerKeys(child)]))
}

// The answer keys are the workshop's solutions: students can open the deployed site's JS, so they never reach the bundle.
function stripAnswerKeys(): Plugin {
  return {
    name: 'peluda:strip-answer-keys',
    enforce: 'pre',
    transform(code, id) {
      if (!DATA_JSON.test(id)) {
        return null
      }
      return { code: JSON.stringify(withoutAnswerKeys(JSON.parse(code))), map: null }
    },
  }
}

export default defineConfig({
  plugins: [stripAnswerKeys(), react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
