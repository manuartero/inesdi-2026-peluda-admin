# Peluda Admin

A fake backoffice for **Peluda**, the fictional pet-food subscription company used in the INESDI workshop *Prompt engineering estratégico* (November 2026). Students copy tickets, contracts and reviews from it and paste them into a chat assistant to practise writing prompts.

All companies, people and data are made up. The UI and the content are in Spanish; the code is in English.

- Plan: [`init.plan.md`](init.plan.md)
- Data model: [`data/schema.md`](data/schema.md)

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm check:data   # validates data/ and the UI labels (also run by pnpm build)
pnpm build
pnpm lint
```

The CMS "today" is fixed at 24/11/2026. Every `answerKey` is stripped from the bundle at build time (`vite.config.ts`), so the deployed site never ships the workshop's solutions.
