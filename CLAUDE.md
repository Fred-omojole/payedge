# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@COLORS.md

## Commands

- `npm run dev` — Next.js dev server (<http://localhost:3000>)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config: `eslint-config-next` core-web-vitals + typescript)

There is no test runner configured. Do not add `npm test` invocations or scaffold a framework unless asked.

## Stack notes that override your defaults

- **Next.js 16** (App Router) + **React 19** + **React Compiler** (`reactCompiler: true` in [next.config.ts](next.config.ts)). Some Next.js 16 APIs differ from older training data — `node_modules/next/dist/docs/` is the source of truth.
- **React Compiler is on.** Do not add `useCallback`, `useMemo`, or `React.memo` — the compiler handles memoization. Avoid `useEffect` for state-machine orchestration; chain async flows directly from event handlers (see architecture below).
- **Tailwind v4, no `tailwind.config.ts`.** All design tokens are CSS variables inside the `@theme inline` block in [app/globals.css](app/globals.css). The Tailwind-v3 config snippet in AGENTS.md is illustrative only — edit the CSS file instead.
- **shadcn/ui** is configured via [components.json](components.json). Files in [components/ui/](components/ui/) are generated — do not edit them.
- Path alias `@/*` → repo root (see [tsconfig.json](tsconfig.json)).

## What this app is

PAYEDGE is a single-page **interactive payment-flow simulator** for engineers, PMs, and QA. It is *not* a checkout. It looks like one on the surface (card form, "Pay Now" button) so the demo feels real, but every API call is mocked in-process — opening the browser network tab during a run shows zero outbound requests (AC-10).

"Simulating payments" specifically means **reproducing the failure modes of a production payment pipeline on demand**:

- The user picks a failure mode by typing a magic test-card number (see `TEST_CARDS` in [lib/scenarios.ts](lib/scenarios.ts)).
- A typed state machine drives the UI through every realistic transition — validation, intent creation, retries with exponential backoff, idempotency-cache hits, card declines, payment confirmation, order creation, partial failures, recovery, and terminal failure.
- All three UI panels (flow stepper, active screen, event log + inspector) are pure projections of one `CheckoutContext`. There is no place to demo a flow that the state machine doesn't model.

The audience is internal: a tool for reading code, writing bug reports, and aligning on what the real pipeline should do in each state.

## Supported scenarios & edge cases

Five scenarios, selected via test-card number on submit (see [lib/scenarios.ts](lib/scenarios.ts) for the full map). Each one exercises a different branch of the state machine:

| Scenario | Magic card | Failure point | What it demonstrates |
| --- | --- | --- | --- |
| `happy_path` | `4242 4242 4242 4242` | none | `idle → confirmed` end-to-end |
| `network_timeout` | `4000 0000 0000 0119` | `creating_intent` | 3 retries with 1s/2s/4s exponential backoff, **same idempotency key on every attempt**, then `hard_failure` with a support ref |
| `card_declined` | `4000 0000 0000 0002` | `confirming_payment` | Form unlocks, `intentId` + `idempotencyKey` preserved, user retries with a different card |
| `insufficient_funds` | `4000 0000 0000 9995` | `confirming_payment` | Same as `card_declined` but with a different `DeclineCode` |
| `partial_failure` | `4100 0000 0000 0019` | `creating_order` | PSP confirmed payment, DB write failed — dual badge (green payment / red order) + recovery CTA that retries order creation with the same key |

Additional edge cases that emerge from the machine itself:

- **Idempotency cache hit** — submitting the same key twice (which happens implicitly during `network_timeout` retries) returns the cached `intentId` via the `idempotency_hit` state instead of creating a new intent.
- **Recovery from `partial_failure`** — `mockApi.recoverOrder` always succeeds, demonstrating that order-creation is safe to retry under the same idempotency key.
- **Reset mid-flow** — any in-flight async work is cancelled via a shared `useRef<AbortController>` in [components/simulator/ActiveState.tsx](components/simulator/ActiveState.tsx).

Unknown card numbers fall back to `happy_path` (`DEFAULT_SCENARIO` in `scenarios.ts`).

## Mock data conventions

ID/payload shape mimics Stripe-style identifiers so the UI reads like a real PSP integration. All generators live in [lib/idempotency.ts](lib/idempotency.ts):

- **Idempotency key** — `crypto.randomUUID()` (v4). Generated in the event handler the moment the form is submitted, passed into both the reducer action and the async flow. **Never regenerated within a session** — `RETRY` reuses the existing key. Only `RESET` produces a fresh one.
- **Intent ID** — `pi_<base36-timestamp><base36-random>`.
- **Order ID** — `ord_<base36-timestamp><base36-random>`.
- **Error ref** — `ERR-<base36-timestamp-uppercase>` — shown to the user in `hard_failure` / `partial_failure` as a copy-able support reference.
- **Log timestamps** — `HH:MM:SS.mmm` (millisecond precision), formatted in `formatTimestamp()`. Never use `Date.now()` or ISO strings for log display.

The mock API ([lib/mock-api.ts](lib/mock-api.ts)) intentionally mirrors the shape a real client would expose (`createIntent`, `confirmPayment`, `createOrder`, `recoverOrder`) so swapping it for a real PSP is a single-file change. It also holds a module-level `Map` for idempotency-cache simulation — `clearIdempotencyCache()` must be called on full reset (see [components/simulator/Shell.tsx](components/simulator/Shell.tsx)).

The **card number is never part of any payload**. It is read once in [components/checkout/CardForm.tsx](components/checkout/CardForm.tsx) `handleSubmit`, mapped through `TEST_CARDS` to a `Scenario`, and discarded. Only the `Scenario` flows downstream into `mockApi`.

## Architecture — the load-bearing split

The state machine and the async orchestration are intentionally separated:

- **[lib/machine.ts](lib/machine.ts)** — pure reducer over `CheckoutContext`. Every action mutates state *and* appends a `LogEntry` so the event log stays in lockstep with the state. No I/O, no timers, no side effects. `useCheckoutMachine()` exposes typed action dispatchers plus derived flags (`isLoading`, `isTerminal`, `canRetryCard`, etc.).
- **[components/simulator/ActiveState.tsx](components/simulator/ActiveState.tsx)** — the only place async happens. Three flows (`runPaymentFlow`, `runCardRetryFlow`, `runRecoveryFlow`) share a `useRef<AbortController>` so resets/scenario changes cancel in-flight work. Flows call `mockApi.*`, catch typed errors (`NetworkTimeoutError`, `OrderCreationError`), and dispatch reducer actions to report progress.
- **[lib/mock-api.ts](lib/mock-api.ts)** — the boundary that would be swapped for real HTTP. Holds a module-level `Map` for idempotency-cache simulation. Throws `NetworkTimeoutError` / `OrderCreationError` for failure scenarios — the flow uses `instanceof` to branch.

When adding a new state or transition: add it to [types/index.ts](types/index.ts), handle it in the reducer (with log entries), wire any async into one of the flows in `ActiveState.tsx`, and add a render branch in the same file's switch. Do not introduce local state in leaf components — everything reads from `CheckoutContext`.

## Error & failure-state rules

Failure modeling is the whole point of this app — treat the rules below as load-bearing.

- **Failures are first-class states, not exceptions floating in component code.** Every failure mode has a named state (`retrying`, `card_declined`, `partial_failure`, `hard_failure`) and a dedicated screen component. Do not surface raw `Error` objects to the UI — convert to a state transition.
- **Use the typed exception classes** in [lib/mock-api.ts](lib/mock-api.ts) (`NetworkTimeoutError`, `OrderCreationError`). Branch with `instanceof`, not by inspecting `.message`. Add a new class if you add a new failure category — do not throw plain `Error`.
- **Never show raw decline codes to the user.** Map through `DECLINE_MESSAGES` in [lib/scenarios.ts](lib/scenarios.ts). Raw codes are fine in the event log and inspector (developer-facing surfaces) but not in user-visible copy. (Audit: [components/checkout/DeclinedBanner.tsx](components/checkout/DeclinedBanner.tsx) currently shows `Code: {declineCode}` to the user — drift from this rule.)
- **Every failure transition logs an `ERROR` entry with structured `meta`** (`httpStatus`, `attempt`, `declineCode`, `errorRef` as relevant). The log entry is generated in the reducer, not at the call site, so the log can never desync from state.
- **Hard failures must produce a support reference** via `generateErrorRef()` and surface it to the user with a copy affordance. No auto-retry from `hard_failure` — it is terminal.
- **Retries reuse the idempotency key.** The `RETRY` action does not regenerate it. If you add a new retry path, follow the same rule.
- **Cancellation, not orphaned promises.** Any new async work in `ActiveState` must check `controller.signal.aborted` after every `await` and bail. The shared `flowRef` makes this automatic if you follow the existing pattern.

## Current status

The simulator is feature-complete against the AGENTS.md acceptance criteria. Working tree is clean; `master` is the only branch.

Recent commit trajectory:

- `6cffa67` — Vercel Analytics + OpenGraph/Twitter metadata for the public deploy (most recent)
- `69318c3` — asset swap
- `1cb681e` — main simulator implementation landed here
- `b2c6a59` — hydration fix

Known drift / unfinished polish surfaced during review (none of these block the demo):

- `DeclinedBanner` shows the raw `declineCode` to the user — violates the "never show raw codes" rule above.
- `EventLog` tag styles use inline hex literals instead of the `--color-tag-*` tokens already defined in [app/globals.css](app/globals.css).
- AGENTS.md promises a topbar scenario selector and delay slider; the topbar currently only has Reset, so scenario selection is implicit via test card number.
- `react-hook-form`, `@hookform/resolvers`, `zod`, and `@base-ui/react` are installed but unused. [CardForm.tsx](components/checkout/CardForm.tsx) uses plain `useState`.
- `STATE_LABELS` in [lib/scenarios.ts](lib/scenarios.ts) is defined but not imported anywhere — `FlowCanvas` renders raw state strings.
- `Shell.handleReset` clears the idempotency cache; `ActiveState.handleReset` (used by Success/HardFailure screens) does not — resetting from those screens leaves the cache populated.

When picking up work, confirm scope with the user before treating any of the above as a task — some may be intentional.
