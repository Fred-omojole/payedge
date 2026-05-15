# PAYEDGE

> Interactive payment-flow simulator. A state-machine-driven UI that reproduces real-world payment pipeline behavior — retries, declines, idempotency, and partial failures — entirely in the browser with zero outbound network calls.

[![Live demo](https://img.shields.io/badge/live-demo-F5A623?style=flat-square)](https://payedge-omega.vercel.app/)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss)

![PAYEDGE cover](https://github.com/Fred-omojole/payedge/blob/master/assets/payedge%20cover.png?raw=true)

---

## Why this exists

Production payment pipelines fail in interesting, undocumented ways: 504s mid-intent-creation, idempotency collisions on retry, "the PSP says yes but our DB write failed" partial failures. Engineers and PMs end up reasoning about these states from memory, screenshots, and Slack threads.

**PAYEDGE is an internal tool for reading, reproducing, and aligning on those states.** Pick a failure mode from the topbar (or type a magic test card), watch the full state-machine transition in the flow canvas, and inspect every action in the structured event log. No PSP, no staging environment, no flaky network required.

Open the browser network tab during a run — you'll see zero outbound requests. Everything is mocked in-process behind an interface shaped like a real PSP client.

---

## Features

- **12-state machine** with typed discriminated-union transitions — `idle` → `validating` → `creating_intent` → `confirming_payment` → `creating_order` → `confirmed`, with named branches for retries, declines, idempotency hits, partial failures, and recovery.
- **Five failure scenarios** triggered by Stripe-style magic card numbers or the topbar selector.
- **Three-panel layout**: flow canvas (left), active state UI (centre), event log + state inspector (right). All three are pure projections of one `CheckoutContext`.
- **Structured event log** that stays in lockstep with state — every transition appends a tagged entry (`STATE` / `POST` / `IDEM` / `ERROR` / `OK`) with `meta` (idempotency key, intent ID, HTTP status, retry attempt, decline code, error ref).
- **Cancellable async flows** via a shared `useRef<AbortController>` — resets and scenario changes cleanly abort in-flight work.

### Scenarios

| Scenario | Magic card | Failure point | Demonstrates |
| --- | --- | --- | --- |
| `happy_path` | `4242 4242 4242 4242` | none | End-to-end success |
| `network_timeout` | `4000 0000 0000 0119` | `creating_intent` | 3 retries with 1s / 2s / 4s exponential backoff, **same idempotency key on every attempt**, then `hard_failure` with a support reference |
| `card_declined` | `4000 0000 0000 0002` | `confirming_payment` | Form unlocks, intent ID preserved, user retries with a different card |
| `insufficient_funds` | `4000 0000 0000 9995` | `confirming_payment` | Same shape as `card_declined`, different decline code |
| `partial_failure` | `4100 0000 0000 0019` | `creating_order` | PSP confirmed payment, DB write failed — dual badge (green payment / red order) + recovery CTA that retries order creation under the same idempotency key |

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Desktop-only — min-width 1280px (it's a developer tool).

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config) |

---

## Architecture

The state machine and the async orchestration are intentionally separated:

- **`lib/machine.ts`** — pure reducer over `CheckoutContext`. Every action mutates state *and* appends a `LogEntry`, so the event log can never desync from the machine. No I/O, no timers.
- **`components/simulator/ActiveState.tsx`** — the only place async happens. Three flows (`runPaymentFlow`, `runCardRetryFlow`, `runRecoveryFlow`) call the mock API, catch typed errors (`NetworkTimeoutError`, `OrderCreationError`), and dispatch reducer actions to report progress.
- **`lib/mock-api.ts`** — the boundary that would be swapped for a real PSP client. Holds a module-level `Map` for idempotency-cache simulation.

```text
/app                           Next.js App Router entry
/components
  /simulator                   Three-panel shell (FlowCanvas, ActiveState, EventLog)
  /checkout                    Per-state screens (CardForm, LoadingOverlay, etc.)
  /ui                          shadcn-generated primitives — do not edit
/lib                           Machine, mock API, scenarios, idempotency helpers
/types                         Shared types (PaymentState, CheckoutContext, ...)
```

### Idempotency rules

- The idempotency key is `crypto.randomUUID()`, generated on form submit and stored in `CheckoutContext.idempotencyKey`.
- It is **never regenerated within a session** — retries reuse the same key. Only a full reset produces a new one.
- The mock API caches by key: a duplicate request returns the cached `intentId` via the `idempotency_hit` state instead of creating a new intent.

### Card-number handling

The card number is read once in `CardForm.handleSubmit`, mapped through `TEST_CARDS` to a `Scenario`, and discarded. It is never stored in machine context, never logged, never sent anywhere. The topbar scenario selector can override the card-number lookup without breaking this invariant.

---

## Tech stack

- **Framework** — Next.js 16 (App Router) with React Compiler enabled
- **Language** — TypeScript (strict)
- **UI** — shadcn/ui + Tailwind CSS v4 (tokens in `@theme inline` inside `app/globals.css`)
- **State** — `useReducer` over a typed discriminated-union action set
- **Card visual** — `react-credit-cards-2`
- **Font** — Geist (sans + mono)

---

## Acceptance criteria

The simulator is considered correct when all of these pass without any external services:

- `AC-01` Happy path completes `idle → confirmed` with a full event log
- `AC-02` Network timeout shows 3 retries (1s / 2s / 4s) then `hard_failure`
- `AC-03` Same idempotency key on every log entry in a session
- `AC-04` Duplicate submission shows the cached response with the same intent ID
- `AC-05` Card declined returns to a usable form with the intent ID preserved
- `AC-06` Partial failure shows green payment badge + red order badge simultaneously
- `AC-07` Retry order creation uses the same key and transitions to `confirmed`
- `AC-08` `hard_failure` shows a support reference and does not auto-retry
- `AC-09` Changing the scenario resets to `idle` and clears the log
- `AC-10` Browser network tab shows zero outbound requests during a full run

---

## License

MIT
