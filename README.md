# Business Process Automator

A no-code workflow automation platform: build visual flows with a drag-and-drop
builder, run them manually or on a schedule, and use **Claude (Anthropic API)**
for tasks that require "understanding" — data extraction, classification, and
content generation — instead of rigid rule-based logic.

Second project in a portfolio series (the first, *Financial AI Insights
Platform*, applies AI to data analysis; this one applies AI to business
**processes**).

<!-- TODO: add a demo GIF/screenshot here showing the builder + a run in action -->

## Features

- **JWT authentication** — register/login, protected routes on both frontend and backend
- **Visual workflow builder** ([React Flow](https://reactflow.dev)) with 5 node types:
  - **Trigger** — manual start of a flow
  - **AI Action** — extraction, classification, or content generation via Claude
  - **Condition** — if/else branching based on the previous node's output
  - **Action (Google Sheets)** — read from or append a row to a spreadsheet
  - **End** — terminates the flow
- **Execution engine** (`backend/engine/executor.js`) — walks the flow graph node by
  node, following condition branches, with per-node retries (exponential backoff)
  and detailed logs (duration + input/output snapshot) for every step
- **Scheduled triggers** — any workflow can run automatically on a cron schedule
  (`node-cron`), hot-reloaded when you change the schedule — no server restart needed
- **Execution history dashboard** — every run (manual or scheduled) is logged with
  status, duration, and a full step-by-step log you can inspect
- **Failure email alerts** — if a workflow run fails, the owner gets notified by email
  (Resend)

## Tech stack

```
Frontend:       React + Vite + TailwindCSS + React Flow
Backend:        Node.js + Express (ESM)
Database:       PostgreSQL + Prisma ORM
AI:             Claude API (Anthropic) — claude-sonnet-4-6
Scheduling:     node-cron
Integrations:   Google Sheets API (Service Account)
Email:          Resend
Auth:           JWT
```

## Project structure

```
business-process-automator/
├── frontend/     React + Vite + TailwindCSS SPA
├── backend/      Express API + execution engine
│   ├── engine/   executor.js, scheduler.js, nodes/ (per-node-type logic)
│   ├── services/ claudeService.js, googleSheetsService.js, emailService.js
│   └── prisma/   schema.prisma + migrations
└── CLAUDE.md     Full project context, architecture decisions, and dev log
```

See [`CLAUDE.md`](./CLAUDE.md) for the complete data model, integration
details, and a running log of technical decisions (and why they were made).

## Getting started

### Prerequisites

- Node.js 20+
- A running PostgreSQL instance
- An [Anthropic API key](https://console.anthropic.com)
- (Optional, for the full example below) A [Resend](https://resend.com) API key
  and a Google Cloud Service Account with Sheets API access

### Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY, ...
npx prisma migrate dev
npm run dev             # http://localhost:4000

# Frontend (in a separate terminal)
cd frontend
npm install
cp .env.example .env    # VITE_API_URL, defaults to http://localhost:4000/api
npm run dev              # http://localhost:5173
```

## Real-world example: automating invoice processing

This is the flow that exercises every part of the engine end-to-end: it reads
an unstructured invoice text, uses Claude to pull out the structured fields,
checks whether it found an amount, and — only if it did — logs the invoice to
a Google Sheet.

```
Trigger (manual)
   │
   ▼
AI Action — subtype "extraction"
   │  extracts { monto, fecha, proveedor, concepto } from free-form text
   ▼
Condition — field "monto", operator "exists"
   │
   ├── ✓ true  ──▶ Action (Google Sheets, "write") ──▶ End
   └── ✗ false ──▶ End
```

**Why this shape:** it's a realistic business rule — "only log invoices where
we could actually confirm an amount" — expressed entirely through the visual
builder, no code. The condition node prevents garbage rows (e.g. a document
that wasn't actually an invoice) from polluting the spreadsheet.

### Reproducing it

1. Create a new workflow from the Dashboard.
2. Drag in a **Trigger**, an **AI Action**, a **Condition**, an **Action**, and two
   **End** nodes.
3. Connect them as shown above.
4. Configure each node:
   - **AI Action**: subtype = "Extracción de datos"
   - **Condition**: field = `monto`, operator = "existe"
   - **Action**: operation = "Escribir en Sheets", `spreadsheetId` = the ID from
     your sheet's URL, `range` = e.g. `Hoja 1!A1`
5. Share the target Google Sheet with your Service Account's `client_email`
   (Editor access) — see `CLAUDE.md` for the full Service Account setup steps.
6. Save, then run it with a sample input, e.g.:

   ```
   Invoice #789, amount $999, date 2026-03-01, vendor Gamma Ltd, item: technical support
   ```

   The condition should evaluate to `true` (an amount was found), and a new row
   appears in your spreadsheet.

7. Try it again with a paragraph that has nothing to do with invoicing — the
   condition evaluates to `false`, and the flow ends without touching the
   spreadsheet.

8. Optionally, set a cron schedule on the workflow (e.g. reading new rows from
   an "inbox" sheet on a timer) to see it run unattended — check the
   **execution history** page to confirm it ran without you clicking anything.

If you break something on purpose (e.g. a temporarily invalid API key), you'll
see the retry-with-backoff behavior in the logs, and — if a run ultimately
fails — an email alert in your inbox.

## Development phases

The project was built in three phases, each documented in detail (including
technical trade-offs and why they were made) in [`CLAUDE.md`](./CLAUDE.md):

1. **MVP** — auth, visual builder, execution engine, first AI-connected node
2. **Real automation** — conditional branching, retries, detailed logs,
   scheduled triggers, Google Sheets integration
3. **Polish** — execution monitoring dashboard, failure alerts, this
   documented example, and deployment

## Deployment

_Coming soon — frontend on Vercel, backend + Postgres on Railway/Render._

## License

Portfolio project — not licensed for reuse.
