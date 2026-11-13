# Peluda Admin · Plan

## What it is for

A **fake but believable backoffice** for Peluda, the fictional company used in the INESDI workshop *Prompt engineering estratégico* (2026). It is not a product: it is a **prop** for the workshop.

- **Realistic demos:** a ticket, contract or review is copied from "the company system" and pasted into Claude or ChatGPT, the way someone would at work.
- **Screenshots for the slides:** the before (an inbox with 450 unclassified tickets: today's 150 plus the two days before) and the after.
- **Practice after the session:** students who watch the recording can open it, pick their own tickets or reviews and practise.
- **Consistency:** the same customer, pet and order show up in the ticket, the review and the customer record.

**What it is not:** no AI inside, no login, no backend. The AI is used outside, in the chat, because the workshop is no-code and what it teaches is writing the prompt.

## Screens

The UI is in Spanish: the students are from Spain and Latin America.

| # | Screen | What it shows | Case |
| --- | --- | --- | --- |
| 1 | **Home** | KPIs from the company dossier: subscribers, open tickets, 26 h first response time, unanswered reviews | Context |
| 2 | **Ticket inbox** | List with date, country, channel, subject and status ("Sin clasificar"). Filter by country | Case 1 |
| 3 | **Ticket detail** | Full message, customer and pet details, order history. A **"Copiar para el prompt"** button | Case 1 |
| 4 | **Customers** | Record: subscription, pet(s), orders, tickets and reviews | All |
| 5 | **Suppliers and contracts** | The 3 contracts with key dates and a viewer for the full text | Case 2 |
| 6 | **Reviews** | List with stars, channel, country and status ("Sin responder"). Detail with a "Copiar" button | Case 3 |
| 7 | **Brand** | The brand voice guide, available from inside the system | Case 3 |

Everything is **read-only**. If needed, a screen could fake "save the classification", but not for now.

## Data

A **single data source** feeds the CMS **and** the workshop case files (CSV and paste-ready text), so the slides and the CMS never disagree. The data model is in [`data/schema.md`](data/schema.md).

| Entity | Volume | How it is made |
| --- | --- | --- |
| Customers and pets | ~600 and ~750 | Generated (fictional names across the five countries) |
| Subscriptions and orders | ~750 and ~2,600 | Generated |
| Tickets | ~450 (150 a day: today and a 2-day backlog) | **30 handwritten for the case** (with traps) + generated filler |
| Contracts | 3 | **Handwritten**, with traps |
| Reviews | ~320 | **20 handwritten for the case** + generated filler |
| Products and plans | ~15 | Handwritten, from the dossier |

All personal data is made up. No name may match a well-known person, and no real emails or phone numbers: `example.com` domains and test numbers only.

## Stack

- **Vite + React + TypeScript**, built as a **static site** (no server).
- **shadcn/ui** (with Tailwind), with a **plain, sober** look: an internal tool with a simple Peluda logo.
- Data lives as JSON inside the project, and a script generates the workshop case files from it.

## Where it runs

- **Locally**, for the live demos and the screenshots.
- **On Vercel (free tier)**, so students can practise after the session. It is an SPA, so `vercel.json` needs a rewrite rule for routes to work on reload.

## Phases

| Phase | What | Output |
| --- | --- | --- |
| 0 | Data model (entities and fields) | `data/schema.md`, `src/data/model.types.ts` |
| 1 | Handwritten content: 30 tickets, 3 contracts, 20 reviews, brand voice | `data/handwritten/` |
| 2 | Generated filler with a fixed seed (always the same output) + export to the case files | JSON + CSV |
| 3 | CMS screens | Static site |
| 4 | Screenshots for the slides + deploy | PNG + link |

Phases 0 to 2 are needed for the cases anyway. The CMS itself (phases 3 and 4) is the extra: about a day of work.
