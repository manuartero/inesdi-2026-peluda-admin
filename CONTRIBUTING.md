# Contributing to Peluda Admin

Thanks for helping. The UI and the content are in Spanish; code, comments, docs and commit messages are in English.

## Run it

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm blue-ball    # lint + unit tests + build (the build runs check:data): run before every commit
```

| Command | What it does |
| --- | --- |
| `pnpm generate` | Rewrites `data/generated/` (fixed seed), then `check:data` |
| `pnpm check:data` | Validates `data/` and the UI labels |
| `pnpm test:unit` | Vitest: a happy-path test per screen, plus the relative-date rules |
| `pnpm lint` | oxlint |
| `pnpm build` | `check:data`, type check, Vite build |

## The data

Field by field: [`data/schema.md`](data/schema.md). The original plan: [`init.plan.md`](init.plan.md).

## Stack

React 19 · React Router · Vite 8 · TypeScript 7 · Tailwind CSS 4 · shadcn/ui on Radix · Lucide icons · Vitest + Testing Library · oxlint · deployed on Vercel.

The README's coverage badge is a snapshot: 84 % of lines in `src/` (generator and CLIs excluded), measured with `@vitest/coverage-v8` on 16/11/2026. It is not measured in CI.
