# edgecase — Colour System & Design Tokens

> Reference this file for every styling decision.
> The UI in the screenshot uses a dark theme. These are the exact tokens to use.

---

## Theme

**Dark theme. Always.**
Background is near-black. Surfaces are dark gray. Text is off-white.
This is a developer tool — dark theme is the right call.

```ts
// tailwind.config.ts
// Add these to your theme.extend.colors
```

---

## Core palette

### Backgrounds

| Token              | Hex       | Usage                      |
| ------------------ | --------- | -------------------------- |
| `bg-base`          | `#0A0A0A` | Page / app background      |
| `bg-surface`       | `#111111` | Cards, panels, modals      |
| `bg-surface-2`     | `#1A1A1A` | Inputs, elevated surfaces  |
| `bg-surface-3`     | `#222222` | Hover states, subtle fills |
| `bg-border`        | `#2A2A2A` | All borders (0.5px)        |
| `bg-border-strong` | `#3A3A3A` | Focused / emphasis borders |

### Text

| Token            | Hex       | Usage                             |
| ---------------- | --------- | --------------------------------- |
| `text-primary`   | `#EDEDED` | Headings, labels, primary content |
| `text-secondary` | `#A1A1A1` | Descriptions, metadata            |
| `text-tertiary`  | `#666666` | Timestamps, hints, placeholders   |
| `text-inverse`   | `#0A0A0A` | Text on light backgrounds         |

### Brand

| Token          | Hex       | Usage                                                 |
| -------------- | --------- | ----------------------------------------------------- |
| `brand`        | `#F5A623` | Active state accent (amber/gold — matches screenshot) |
| `brand-subtle` | `#2A1F0A` | Brand background fills                                |
| `brand-border` | `#6B4700` | Brand borders                                         |

---

## Semantic colours

These encode meaning in the state machine. Use these and ONLY these for state-related UI.

### Blue — active / in-progress states

```
creating_intent, confirming_payment, creating_order, idempotency_hit
```

| Token         | Hex       |
| ------------- | --------- |
| `blue`        | `#3B82F6` |
| `blue-bg`     | `#0D1626` |
| `blue-border` | `#1E3A5F` |
| `blue-text`   | `#60A5FA` |

### Amber — warning / retry states

```
retrying, card_declined, recovering
```

| Token          | Hex       |
| -------------- | --------- |
| `amber`        | `#F5A623` |
| `amber-bg`     | `#1F1500` |
| `amber-border` | `#6B4700` |
| `amber-text`   | `#FBB740` |

### Green — success states

```
confirmed, payment confirmed badge in partial_failure
```

| Token          | Hex       |
| -------------- | --------- |
| `green`        | `#10B981` |
| `green-bg`     | `#051A10` |
| `green-border` | `#0D4A28` |
| `green-text`   | `#34D399` |

### Red — failure states

```
hard_failure, order creation failed badge in partial_failure
```

| Token        | Hex       |
| ------------ | --------- |
| `red`        | `#EF4444` |
| `red-bg`     | `#1A0505` |
| `red-border` | `#4A1010` |
| `red-text`   | `#F87171` |

### Gray — inactive / idle states

```
idle, dim/future nodes in the flow canvas
```

| Token         | Hex       |
| ------------- | --------- |
| `gray`        | `#525252` |
| `gray-bg`     | `#1A1A1A` |
| `gray-border` | `#2A2A2A` |
| `gray-text`   | `#A1A1A1` |

---

## State → colour mapping

This is the single source of truth for which colour a state uses.
Every badge, every stepper node, every event log tag follows this table.

| State                | Colour      | Background | Text       | Border     |
| -------------------- | ----------- | ---------- | ---------- | ---------- |
| `idle`               | gray        | `#1A1A1A`  | `#A1A1A1`  | `#2A2A2A`  |
| `validating`         | blue        | `#0D1626`  | `#60A5FA`  | `#1E3A5F`  |
| `creating_intent`    | blue        | `#0D1626`  | `#60A5FA`  | `#1E3A5F`  |
| `retrying`           | amber       | `#1F1500`  | `#FBB740`  | `#6B4700`  |
| `idempotency_hit`    | blue        | `#0D1626`  | `#60A5FA`  | `#1E3A5F`  |
| `confirming_payment` | blue        | `#0D1626`  | `#60A5FA`  | `#1E3A5F`  |
| `card_declined`      | amber       | `#1F1500`  | `#FBB740`  | `#6B4700`  |
| `creating_order`     | blue        | `#0D1626`  | `#60A5FA`  | `#1E3A5F`  |
| `partial_failure`    | red + green | dual badge | dual badge | dual badge |
| `recovering`         | amber       | `#1F1500`  | `#FBB740`  | `#6B4700`  |
| `confirmed`          | green       | `#051A10`  | `#34D399`  | `#0D4A28`  |
| `hard_failure`       | red         | `#1A0505`  | `#F87171`  | `#4A1010`  |

---

## Event log tag colours

| Tag       | Background | Text      | When used                 |
| --------- | ---------- | --------- | ------------------------- |
| `STATE`   | `#0D1626`  | `#60A5FA` | State machine transitions |
| `POST`    | `#1A1A1A`  | `#A1A1A1` | Mock API requests         |
| `IDEM`    | `#1A0A2A`  | `#A78BFA` | Idempotency cache hits    |
| `TIMEOUT` | `#1A0505`  | `#F87171` | Network timeout errors    |
| `ERROR`   | `#1A0505`  | `#F87171` | Any failure event         |
| `OK`      | `#051A10`  | `#34D399` | Success responses         |

---

## Typography

```css
/* Font stack */
--font-sans: "Geist", system-ui, sans-serif;
--font-mono: "Geist Mono", "Fira Code", monospace;

/* Scale */
--text-xs: 11px; /* timestamps, hints */
--text-sm: 12px; /* labels, tags, meta */
--text-base: 13px; /* body, inputs, log entries */
--text-md: 14px; /* card titles, sub-headings */
--text-lg: 16px; /* section headings */
--text-xl: 20px; /* page-level headings */

/* Weights */
--font-normal: 400;
--font-medium: 500;
/* Never use 600 or 700 — too heavy on dark backgrounds */
```

### Mono usage rules

Use `font-mono` for:

- All state names (`retrying`, `creating_intent`, etc.)
- Idempotency keys
- Intent IDs and order IDs
- Timestamps in the event log
- HTTP methods and paths (`POST /v1/intents`)
- Inspector key/value pairs
- Test card numbers

Use `font-sans` for:

- Everything else

---

## Component tokens

### Borders

```css
/* Always 0.5px — never 1px */
border: 0.5px solid #2a2a2a; /* default */
border: 0.5px solid #3a3a3a; /* hover / focus */
border: 0.5px solid var(--state-border); /* semantic */
```

### Border radius

```css
--radius-sm: 4px; /* tags, pills, small chips */
--radius-md: 6px; /* inputs, buttons */
--radius-lg: 10px; /* cards, panels */
--radius-xl: 16px; /* never used — too round */
```

### Spacing scale

```css
/* Component-internal */
4px   /* icon gap, tight inline */
8px   /* default gap between related items */
12px  /* gap between form fields */
16px  /* panel padding, card padding */
20px  /* section gap */
24px  /* large section gap */
```

---

## Tailwind config additions

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        base: "#0A0A0A",
        surface: {
          DEFAULT: "#111111",
          2: "#1A1A1A",
          3: "#222222",
        },
        border: {
          DEFAULT: "#2A2A2A",
          strong: "#3A3A3A",
        },
        ink: {
          DEFAULT: "#EDEDED",
          2: "#A1A1A1",
          3: "#666666",
        },
        brand: {
          DEFAULT: "#F5A623",
          subtle: "#2A1F0A",
          border: "#6B4700",
        },
        state: {
          blue: "#3B82F6",
          "blue-bg": "#0D1626",
          "blue-bd": "#1E3A5F",
          "blue-text": "#60A5FA",
          amber: "#F5A623",
          "amber-bg": "#1F1500",
          "amber-bd": "#6B4700",
          "amber-text": "#FBB740",
          green: "#10B981",
          "green-bg": "#051A10",
          "green-bd": "#0D4A28",
          "green-text": "#34D399",
          red: "#EF4444",
          "red-bg": "#1A0505",
          "red-bd": "#4A1010",
          "red-text": "#F87171",
        },
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "Fira Code", "monospace"],
      },
      borderWidth: {
        DEFAULT: "0.5px",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
    },
  },
};
```

---

## shadcn CSS variable overrides

Add these to your `globals.css` to make shadcn components match the dark theme:

```css
:root {
  --background: 0 0% 4%; /* #0A0A0A */
  --foreground: 0 0% 93%; /* #EDEDED */
  --card: 0 0% 7%; /* #111111 */
  --card-foreground: 0 0% 93%;
  --popover: 0 0% 7%;
  --popover-foreground: 0 0% 93%;
  --primary: 0 0% 93%; /* buttons default to light */
  --primary-foreground: 0 0% 4%;
  --secondary: 0 0% 10%; /* #1A1A1A */
  --secondary-foreground: 0 0% 63%;
  --muted: 0 0% 10%;
  --muted-foreground: 0 0% 40%;
  --accent: 0 0% 13%;
  --accent-foreground: 0 0% 93%;
  --destructive: 0 72% 51%; /* #EF4444 */
  --destructive-foreground: 0 0% 93%;
  --border: 0 0% 16%; /* #2A2A2A */
  --input: 0 0% 16%;
  --ring: 38 90% 55%; /* amber focus ring */
  --radius: 0.375rem; /* 6px */
}
```

---

## Do not use

- White or light backgrounds anywhere
- `font-weight: 600` or `700`
- `border-width: 1px` or higher
- Purple for anything (reserved — not in this palette)
- Gradients
- Box shadows (except focus rings)
- Any colour not in this file
