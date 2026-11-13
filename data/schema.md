# Peluda Admin · Data model

> Phase 0. The TypeScript types are in `src/data/model.types.ts` and must match this document. The source of truth for the company is the workshop's company dossier.
>
> **Code is in English** (folders, files, types, fields, enum values, IDs). What students see (messages, names, contract and review text) and the UI labels are in Spanish: the CMS maps values to labels when it shows them (`unclassified` → "Sin clasificar").

## Principles

- **One source.** Everything lives in `data/` as JSON (contracts as Markdown). The CMS imports it and a script exports the workshop case files.
- **Handwritten and generated stay apart.** Handwritten content (with the traps) goes in `data/handwritten/`; filler is generated with a fixed seed into `data/generated/` and is never edited by hand.
- **Fixed reference date:** the CMS "today" is **Tuesday 24/11/2026** (session 1), so the screenshots, the demo and the recording all match.
- **Answer key kept apart.** What the model *should* find (expected category, contract trap…) goes in an `answerKey` field that the CMS never shows and the "Copiar para el prompt" button never copies. It is exported to a separate answer-key file per case.
- **Made-up personal data:** `@example.com` emails, test phone numbers, no well-known names.

## Folders

```
cms/app/
├── data/
│   ├── schema.md           # this document
│   ├── handwritten/        # plans, products, suppliers, case customers, pets, subscriptions and orders, 30 tickets, 20 reviews
│   │   └── contracts/      # 3 contracts in Markdown (Spanish text)
│   └── generated/          # fixed-seed filler written by `pnpm generate` (do not edit)
├── src/data/model.types.ts # types shared by the CMS and the scripts
└── src/generate/           # the generator: rules in .ts, names and texts in .json
```

Handwritten customers use IDs `CUS-00101` to `CUS-00599` (the middle digit is the country); generated ones start at `CUS-01000`.

The case customers' subscriptions and the orders their tickets talk about are handwritten (Raúl's charge after cancelling, Marina's broken box, Daniel's «entregado»…); the rest of their order history is generated around them. `src/data/peluda.data.ts` merges both folders and checks every reference.

## Common types

| Type | Values |
| --- | --- |
| `Country` | `ES` · `MX` · `CO` · `PE` · `AR` |
| `Currency` | `EUR` · `MXN` · `COP` · `PEN` · `ARS` (one per country) |
| `Species` | `dog` · `cat` |
| `IsoDate` | `2026-11-24` or `2026-11-24T09:15:00` (country's local time) |
| Amounts | A number in the country's currency, with decimals (`45`, `849.5`) |

## Entities

### Plan (3, handwritten)

| Field | Example | Note |
| --- | --- | --- |
| `id` | `complete` | `basic` · `complete` · `care` |
| `name` | Completo | |
| `includes` | Pienso + snacks + un juguete al trimestre | |
| `prices` | `{ ES: 45, MX: 849, CO: 199000, PE: 179, AR: 65000 }` | Base price from the dossier |

### Product (~15, handwritten)

| Field | Example | Note |
| --- | --- | --- |
| `id` | `PRD-KIBBLE-ADULT-DOG` | |
| `name` | Pienso Adulto Perro · Receta 2026 | |
| `kind` | `kibble` | `kibble` · `special_diet` · `treat` · `toy` |
| `species` | `dog` | or `both` |
| `manufacturerId` | `SUP-NUTRICAN` | Kibble and diets only |
| `markets` | `["ES"]` | |
| `availableFrom` | `2026-10-01` | **Key to the urgent ticket:** the "new kibble" is a recipe that changed recently |
| `replaces` | `PRD-KIBBLE-ADULT-DOG-2024` | Optional: the previous recipe |

### Customer (~600, generated + the ones the cases need)

| Field | Example | Note |
| --- | --- | --- |
| `id` | `CUS-01042` | |
| `firstName`, `lastName` | Carmen, Ruiz Ortega | Fictional, across the five countries |
| `email` | `carmen.ruiz@example.com` | Always `@example.com` |
| `phone` | `+34 600 000 042` | Test numbers |
| `country`, `city` | `ES`, Valencia | |
| `signupDate` | `2023-03-12` | From 2021 (ES), 2023 (MX), 2024 (PE), 2025 (CO) and 2026 (AR) |
| `notes` | | Optional, internal customer-service notes |

### Pet (~250, one or two per customer)

| Field | Example | Note |
| --- | --- | --- |
| `id`, `customerId` | `PET-01042-1`, `CUS-01042` | |
| `name` | Lola | |
| `species`, `breed` | `dog`, Beagle | 72 % dogs · 28 % cats |
| `birthDate` | `2019-05-01` | Age is computed |
| `weightKg` | `12.4` | |
| `activity` | `medium` | `low` · `medium` · `high` |
| `allergies` | `["pollo"]` | May be empty |

### Subscription (~250, one per pet)

| Field | Example | Note |
| --- | --- | --- |
| `id` | `SUB-01042-1` | |
| `customerId`, `petId`, `planId` | | |
| `status` | `active` | `active` · `paused` · `cancelled` |
| `startDate`, `cancelDate` | | `cancelDate` only when cancelled |
| `monthlyPrice`, `currency` | `47.5`, `EUR` | Depends on the pet's size |
| `productIds` | | What ships every 4 weeks |
| `nextShipment` | `2026-11-28` | |

### Order (~2,600, generated)

| Field | Example | Note |
| --- | --- | --- |
| `id` | `ORD-2026-118734` | |
| `subscriptionId`, `customerId` | | |
| `date` | `2026-11-02` | Every 4 weeks from the subscription's `startDate`; only since August 2026 are kept |
| `lines` | `[{ productId, quantity }]` | |
| `amount`, `currency` | | |
| `status` | `delivered` | `preparing` · `shipped` · `delivered` · `issue` · `returned` |
| `carrier`, `trackingNumber` | Rutas Levante, `RL-55128830` | |
| `charges` | `[{ date, amount, status }]` | Two charges = the "charged twice" case. `status`: `charged` · `refunded` · `failed` |

### Ticket (~450: 150 a day, today plus the 2 days before; 30 handwritten + filler)

| Field | Example | Note |
| --- | --- | --- |
| `id` | `TCK-20261124-0031` | |
| `receivedAt` | `2026-11-24T08:47:00` | |
| `country` | `ES` | |
| `channel` | `email` | `email` · `form` · `app` · `whatsapp` |
| `customerId`, `orderId` | | Optional: some tickets come from someone we cannot identify |
| `sender` | Carmen Ruiz | As the message is signed |
| `subject` | Mi perro no está bien | |
| `message` | | Full text, with a real customer's tone and typos |
| `status` | `unclassified` | Every ticket arrives like this in the CMS |
| `answerKey` | | **Answer key**, never shown (see below) |

A ticket's `answerKey`: `category` (`shipping` · `billing` · `plan_change` · `cancellation` · `product_health` · `account` · `other`), `urgency` (`high` · `medium` · `low`), `trap` (free text in Spanish, for the presenter) and `handwritten` (`true` for the 30 handwritten ones).

### Supplier (5, handwritten)

| Field | Example | Note |
| --- | --- | --- |
| `id` | `SUP-NUTRICAN` | |
| `legalName` | NutriCan Ibérica S.L. | |
| `taxId` | `B00000001` | Made up, with an obvious test format |
| `country`, `city` | `ES`, Lleida | |
| `service` | Fabricación de pienso | |
| `contact` | `{ name, email }` | `@example.com` |
| `contractId` | `CTR-NUTRICAN-2024` | Alimentos del Bajío and Pampa Nutrición have none: the CMS shows "Contrato no digitalizado" |

### Contract (3, handwritten)

| Field | Example | Note |
| --- | --- | --- |
| `id`, `supplierId` | `CTR-NUTRICAN-2024`, `SUP-NUTRICAN` | |
| `title` | Contrato de fabricación y suministro | |
| `signedOn`, `startDate` | | |
| `expiryOnRecord` | `2026-12-31` | **What the team believes**, not what the text says. That gap is the auto-renewal trap |
| `file` | `contracts/nutrican.md` | Full text, 4–6 pages |
| `answerKey` | `{ traps: [{ kind, clause, explanation }] }` | `kind`: `auto_renewal` · `hidden_penalty` · `missing_clause`. `clause` is the paragraph number as written (`14.2`, `II.6`) or, for `missing_clause`, its name («Protección de datos»). `pnpm check:data` checks the paragraph exists, or that a missing clause's name appears nowhere in the text |

### Review (~320: 20 handwritten + filler)

| Field | Example | Note |
| --- | --- | --- |
| `id` | `REV-2026-0412` | |
| `date` | `2026-11-20` | Within the last month |
| `channel` | `google` | `web` · `app` · `google` |
| `country` | `MX` | |
| `customerId` | | Optional: on Google we don't always know who it is |
| `author` | Andrea G. | As published |
| `stars` | `2` | 1–5, overall average ≈ 4.3 |
| `title` | | Optional (Google has none) |
| `text` | | |
| `status` | `unanswered` | or `answered` (~30 %, almost all positive). `pnpm check:data` fails if an unanswered review has a `reply` or an answered one lacks it |
| `reply` | | Only when answered: real examples of the brand voice |
| `answerKey` | `{ kind, trap, handwritten }` | `kind`: `positive` · `negative` · `mixed` · `troll` · `personal_data`. `trap` (optional) is a note in Spanish for the presenter, as in tickets |

### Company (1, handwritten)

The dossier figures for the Home screen: subscribers per country (`subscribers`), churn (`monthlyChurnPct`), tickets per day, average first response time (`firstResponseHours`: 26 h, target 4 h), reviews per month, % answered (30 %) and average rating. "Today" counters (open tickets, unanswered reviews) are computed from the data.

## Consistency to watch

- The customer in the vomiting-dog ticket has a pet, a subscription with the new kibble and a recent order that includes it.
- A ticket's double charge shows up as two `charges` on its order.
- Shipping tickets in Spain use Rutas Levante; in Latin America, a local carrier per country.
- Some customer appears in both a ticket and a review (the same complaint on two channels).
- Contract dates fit the story: Peluda starts in 2021, Mexico in 2023, Peru in 2024, Colombia in 2025 and Argentina in 2026.
