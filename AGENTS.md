<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
The docs are the only source of truth.
<!-- END:nextjs-agent-rules -->

---

# edgecase — AI Agent Context

> Read this file before writing any code for this project.
> This is the single source of truth for what this project is, how it works, and how it should look.

---

## What this project is

**edgecase** is a developer-facing interactive payment flow simulator built with Next.js 16, TypeScript, and shadcn/ui.

It is NOT a real checkout. It is an internal engineering and product tool that demonstrates how a production payment pipeline behaves across all states — including happy path, degraded states, and failure recovery.

The target audience is frontend engineers, backend engineers, product managers, and QA engineers who need to understand, reproduce, and communicate payment flow behaviour without a real PSP or staging environment.

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Components | shadcn/ui |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| State machine | useReducer (typed discriminated union) |
| Card visual | react-credit-cards-2 |
| Analytics | PostHog |
| Font | Geist (sans + mono) — Next.js default |

---

## Layout — three fixed panels

```
┌─────────────────────────────────────────────────────────────┐
│  topbar — scenario selector · delay · reset · run           │
├──────────────┬──────────────────────────┬───────────────────┤
│  LEFT        │  CENTRE                  │  RIGHT            │
│  Flow canvas │  Active state UI         │  Inspector        │
│  (stepper)   │  (what user sees)        │  + Event log      │
│  200px       │  flex: 1                 │  260px            │
└──────────────┴──────────────────────────┴───────────────────┘
```

- Min-width: 1280px (desktop only — this is a developer tool)
- All three panels communicate ONLY through the state machine
- No local state in leaf components — everything derives from machine context

---

## State machine

All UI is derived from this single state type. You can only be in ONE state at a time.

```ts
type PaymentState =
  | 'idle'
  | 'validating'
  | 'creating_intent'
  | 'retrying'
  | 'idempotency_hit'
  | 'confirming_payment'
  | 'card_declined'
  | 'creating_order'
  | 'partial_failure'
  | 'recovering'
  | 'confirmed'
  | 'hard_failure'

type CheckoutContext = {
  state: PaymentState
  scenario: Scenario
  idempotencyKey: string        // UUID v4, generated on submit, stable across retries
  intentId: string | null
  retryCount: number            // 0–3
  backoffMs: number             // 1000 / 2000 / 4000
  declineCode: DeclineCode | null
  orderId: string | null
  errorRef: string | null       // support reference for hard_failure / partial_failure
  eventLog: LogEntry[]
}
```

### State transitions (abbreviated)

```
idle → validating → creating_intent → confirming_payment → creating_order → confirmed
                          ↓                   ↓                    ↓
                       retrying          card_declined        partial_failure
                          ↓                   ↓                    ↓
                    hard_failure            idle               recovering
                                                                   ↓
                                                         confirmed | hard_failure
```

---

## The four scenarios

| Scenario | Failure point | Key behaviour |
|---|---|---|
| `happy_path` | None | Completes idle → confirmed |
| `network_timeout` | `creating_intent` | 3 retries with exponential backoff (1s/2s/4s). Same idempotency key on every retry. Transitions to `hard_failure` after 3 failures. |
| `card_declined` | `confirming_payment` | Returns a decline code. Form unlocks. Intent ID preserved. User retries with new card. |
| `partial_failure` | `creating_order` | Payment confirmed by PSP, order DB write fails. Shows dual status — green confirmed + red failed. Recovery CTA retries order creation with same key. |

---

## Card input system

The card form has THREE independent pieces that share one state object:

```ts
const [cardState, setCardState] = useState({
  number: '',   // formatted as "4242 4242 4242 4242"
  name: '',
  expiry: '',   // formatted as "08/27"
  cvc: '',
  focus: '',    // drives the card flip animation
})
```

1. **`<Cards />`** from `react-credit-cards-2` — pure display, reads state, no logic
2. **shadcn `<Input />`** fields — write to state via onChange
3. **Scenario lookup on submit** — maps card number to scenario, then discards the number

### Test card numbers

```ts
export const TEST_CARDS: Record<string, Scenario> = {
  '4242 4242 4242 4242': 'happy_path',
  '4000 0000 0000 0002': 'card_declined',
  '4000 0000 0000 9995': 'insufficient_funds',
  '4100 0000 0000 0019': 'partial_failure',
  '4000 0000 0000 0119': 'network_timeout',
}
```

**IMPORTANT:** The card number is NEVER stored in the machine context, NEVER logged, NEVER sent anywhere. It is read once on submit to determine the scenario, then discarded.

---

## Idempotency key rules

- Generated with `crypto.randomUUID()` the moment the form is submitted
- Stored in `CheckoutContext.idempotencyKey`
- **Never changes between retries** — same key on all 3 attempts
- Sent as a request header on every mock API call
- Visible in the event log and inspector panel throughout the session
- Only regenerated when the simulator resets to `idle`

---

## Mock API layer

All API calls are mocked. Zero real network requests. The mock reads the active scenario and resolves/rejects accordingly.

```ts
// lib/mock-api.ts
export const mockApi = {
  createIntent: (key: string, scenario: Scenario, delay: number) => Promise<IntentResponse>,
  confirmPayment: (intentId: string, scenario: Scenario) => Promise<ConfirmResponse>,
  createOrder: (intentId: string, key: string, scenario: Scenario) => Promise<OrderResponse>,
}
```

The interface is identical to what a real API client would expose — swapping in real calls later requires changing only this file.

---

## Event log entry shape

```ts
type LogEntry = {
  id: string
  timestamp: string           // ISO, e.g. "14:23:01.441"
  type: 'STATE' | 'POST' | 'IDEM' | 'ERROR' | 'OK'
  message: string
  meta?: {
    idempotencyKey?: string
    intentId?: string
    attempt?: number
    httpStatus?: number
    declineCode?: string
    errorRef?: string
  }
}
```

---

## Folder structure

```
/app
  /page.tsx                   ← root, renders the simulator shell
/components
  /simulator
    Shell.tsx                 ← topbar + three-panel layout
    FlowCanvas.tsx            ← left panel — stepper
    ActiveState.tsx           ← centre panel — switches on state
    EventLog.tsx              ← right panel — log + inspector
  /checkout
    CardForm.tsx              ← card visual + shadcn inputs
    LoadingOverlay.tsx        ← spinner + retry counter
    DeclinedBanner.tsx        ← amber banner for card_declined
    PartialFailure.tsx        ← dual-status screen
    SuccessScreen.tsx         ← confirmed state
    HardFailure.tsx           ← terminal error screen
  /ui                         ← shadcn components (do not edit)
/lib
  mock-api.ts                 ← mock API layer
  machine.ts                  ← useReducer state machine
  scenarios.ts                ← TEST_CARDS + scenario config
  idempotency.ts              ← key generation utility
/types
  index.ts                    ← all shared types
```

---

## Acceptance criteria (from PRD)

The simulator is done when ALL of these pass without any external services:

- AC-01: Happy path completes idle → confirmed with full event log
- AC-02: Network timeout shows 3 retries (1s/2s/4s) then hard_failure
- AC-03: Same idempotency key on every log entry in a session
- AC-04: Duplicate submission shows cached response, same intent ID
- AC-05: Card declined returns to idle with form unlocked, intent ID preserved
- AC-06: Partial failure shows green payment badge + red order badge simultaneously
- AC-07: Retry order creation uses same key, transitions to confirmed
- AC-08: hard_failure shows support ref code, no auto-retry
- AC-09: Changing scenario resets to idle and clears log
- AC-10: Browser network tab shows zero outbound requests

---

## What NOT to do

- Do NOT store card numbers anywhere beyond the submit handler
- Do NOT make real network calls
- Do NOT use local state in leaf components — everything from machine context
- Do NOT add mobile responsive styles — desktop only
- Do NOT validate CVV or expiry as real values — purely cosmetic
- Do NOT change the idempotency key between retries
- Do NOT show raw decline codes to the user — map them to human messages
