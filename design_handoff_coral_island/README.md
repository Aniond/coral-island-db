# Handoff: Coral Island Database

## Overview

A **game companion web app** for the farming/life-sim game *Coral Island*. Players use it as an in-browser reference wiki — browsing crops by season, researching cave loot, looking up foraging spots, reading NPC gift preferences, and chatting with an AI guide. The feel is "polished game wiki meets tropical resort website."

---

## About the Design Files

The files in this bundle are **HTML design prototypes** — high-fidelity references created to show intended look, layout, and interactive behavior. They are **not** production code to ship directly.

Your task is to **recreate these designs in a real codebase** — ideally a React (Next.js or Vite) app. Use the HTML files as a pixel-accurate visual spec and lift exact colors, spacing, typography, and interaction patterns from them.

---

## Fidelity

**High-fidelity (hifi).** These are pixel-level mockups with:
- Final colors, typography, spacing, and component states
- Working filters, search, and navigation
- Functional AI Guide chat simulation (keyword-matched responses)
- Tweaks panel (accent color, card radius, density)
- Mobile-responsive bottom tab bar

Recreate the UI precisely. Every hex value, shadow, and animation duration is intentional.

---

## Tech Stack Recommendation

| Layer | Recommendation |
|---|---|
| Framework | **Next.js 14** (App Router) or **Vite + React** |
| Styling | **Tailwind CSS** (maps cleanly to the token system below) |
| State | React `useState` / `useReducer` — no external store needed |
| Data | JSON files in `/data` to start; swap for API/DB later |
| Fonts | Google Fonts: `Playfair Display` (700), `Inter` (400/500/600) |
| Icons | **Lucide React** — all icon paths match the prototype's SVGs |

---

## Project Structure (Recommended)

```
src/
  app/
    page.tsx                  ← redirects to /crops
    layout.tsx                ← root layout with sidebar
    crops/page.tsx
    caves/page.tsx
    foraging/page.tsx
    npcs/page.tsx
  components/
    Sidebar.tsx
    NavButton.tsx
    AIGuide/
      AIGuide.tsx
      ChatBubble.tsx
      TypingBubble.tsx
    ui/
      Badge.tsx               ← SeasonPill, RankBadge, MineBadge, TypeBadge
      FilterSelect.tsx
      EmptyState.tsx
      LoadingDots.tsx
    pages/
      CropsPage.tsx
      CavesPage.tsx
      ForagingPage.tsx
      NPCPage.tsx
  data/
    crops.json
    caves.json
    foraging.json
    npcs.json
  lib/
    theme.ts                  ← design tokens
    ai-responses.ts           ← keyword → response map
```

---

## Design Tokens

### Colors

```ts
// lib/theme.ts
export const colors = {
  // Brand
  primary:       '#0f766e',   // teal-600 — primary interactive color
  primaryDark:   '#134e4a',   // teal-900 — sidebar background, dark text
  primaryMid:    '#1d8079',   // teal-700 — hover states
  primaryLight:  '#ccfbf1',   // teal-100 — dividers, hover borders
  primaryXLight: '#f0fdfa',   // teal-50  — card hover bg, AI bubbles

  accent:        '#f97316',   // orange-500 — CTAs, active nav indicator
  accentLight:   '#fff7ed',   // orange-50  — user chat bubbles, clear button bg
  accentBorder:  '#fed7aa',   // orange-200

  // Layout
  pageBg:        '#fefce8',   // yellow-50 — main content background (sandy cream)
  cardBg:        '#ffffff',
  cardBorder:    '#99f6e4',   // teal-300
  sidebarBg:     '#134e4a',   // teal-900

  // Text
  textDark:      '#134e4a',   // teal-900
  textMid:       '#0f766e',   // teal-600
  textMuted:     '#6b7a74',   // custom muted green-gray

  // Shadows
  shadow:        '0 1px 4px rgba(0,0,0,0.05)',
  shadowHover:   '0 8px 28px rgba(15,118,110,0.14)',
};
```

### Tweak-controlled tokens (CSS variables)

```css
:root {
  --accent:        #f97316;   /* user-adjustable: coral / seafoam / violet */
  --accent-light:  #fff7ed;
  --accent-border: #fed7aa;
  --radius:        12px;       /* card border-radius: 0–24px */
}
```

Set these on `document.documentElement` when the user changes a tweak.

### Typography

```ts
export const typography = {
  fontHeading: "'Playfair Display', serif",   // page titles, card names
  fontBody:    "'Inter', sans-serif",          // everything else

  // Scale
  pageTitle:   { size: 26, weight: 700, family: 'heading' },
  cardTitle:   { size: 15.5, weight: 700, family: 'heading' },
  body:        { size: 13.5, weight: 400 },
  small:       { size: 12.5, weight: 400 },
  label:       { size: 10.5, weight: 700, transform: 'uppercase', letterSpacing: '0.07em' },
  badge:       { size: 11, weight: 600 },
};
```

### Spacing

The prototype uses 8px as the base unit:

| Token | Value | Usage |
|---|---|---|
| `xs` | 4px | Gap between badge siblings |
| `sm` | 8px | Filter bar gap, small padding |
| `md` | 12px | Card gap (compact), inner card gap |
| `lg` | 16px | Card grid gap (comfortable) |
| `xl` | 20px | Card padding (comfortable) |
| `2xl` | 24px | Page padding (compact) |
| `3xl` | 32px | Page padding (comfortable) |

### Border radius

```ts
card:   'var(--radius, 12px)',   // tweakable
badge:  '999px',                 // fully rounded pills
chip:   '6px',                   // type badges, area tags
input:  '8px',
avatar: '50%',
```

### Shadows

```ts
card:      '0 1px 4px rgba(0,0,0,0.05)',
cardHover: '0 8px 28px rgba(15,118,110,0.14)',
chatPanel: '0 24px 64px rgba(0,0,0,0.16)',
floatBtn:  '0 4px 18px rgba(0,0,0,0.22)',
```

---

## Screens / Views

### 1. App Shell (layout.tsx)

**Layout:** `display: flex; height: 100vh; overflow: hidden; background: #fefce8`

**Sidebar** (left, fixed):
- Width: 256px, `position: sticky; top: 0; height: 100vh`
- Background: `#134e4a`
- Logo section: 22px top padding. Logo mark = 38×38px rounded-10 gradient div (`#0d9488 → var(--accent)`), containing a leaf icon. Title = "Coral Island" in Playfair Display 700 15px white + "DATABASE" in Inter 10px teal-200 uppercase tracking-widest
- Nav items: 13.5px Inter, `gap: 2px` flex column, `padding: 4px 10px`
- **Active state:** `background: rgba(255,255,255,0.11)` + `border-left: 3px solid var(--accent)`; active icon uses `var(--accent)` color
- **Hover state (inactive):** `background: rgba(255,255,255,0.06)`, color → `#e2fdf9`
- Inactive nav color: `#99f6e4`
- Version tag: bottom, `rgba(94,234,212,0.4)`, 11px

**Mobile (≤768px):**
- Sidebar hides (`display: none`)
- Bottom tab bar appears: `position: fixed; bottom: 0; background: #134e4a; border-top: 1px solid rgba(94,234,212,0.2)`
- 5 tabs, each with icon (21px) + short label (10px)

**Main content area:** `flex: 1; height: 100vh; overflow-y: auto; background: #fefce8`
- On page change, trigger fade-in animation: `opacity: 0 → 1, translateY(5px → 0)` over 180ms

---

### 2. Crops Page (`/crops`)

**Page header:**
- H1: "Crops & Plants" — Playfair Display 700 26px `#134e4a`
- Subtitle: 13.5px teal-600, shows total + filtered count

**Filter bar:** `display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px`
- Search input (160px wide): left-padded with search icon
- Season dropdown: values `spring | summer | fall | winter` (displayed capitalized)
- Type dropdown: Fruit / Vegetable / Grain / Flower
- Rank dropdown: F / E / D / C / B / A
- Clear button (shown when any filter active): accent-tinted, shows X icon

**Card grid:** `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px`

**Crop Card:**
```
┌─────────────────────────────────┐
│ Strawberry              [Spring]│  ← Playfair 700 15.5px + SeasonPill
│ [Fruit] [A ★]  [↩ Regrows]     │  ← TypeBadge + RankBadge + regrow chip
│ ─────────────────────────────── │
│ ⏰ 8d      🪙 120g              │  ← clock icon + coin icon (amber)
└─────────────────────────────────┘
```
- Card hover: `translateY(-2px)` + shadow lifts to `shadowHover`; border transitions to `primaryLight`
- Padding: 18px comfortable / 14px compact

**Season pill colors:**
| Season | Background | Text |
|--------|-----------|------|
| Spring | `#dcfce7` | `#16a34a` |
| Summer | `#fef3c7` | `#d97706` |
| Fall   | `#ffedd5` | `#ea580c` |
| Winter | `#dbeafe` | `#2563eb` |
| All    | `#f1f5f9` | `#64748b` |

**Rank badge colors:**
| Rank | Background | Text |
|------|-----------|------|
| F | `#f1f5f9` | `#475569` |
| E | `#fef9c3` | `#a16207` |
| D | `#ffedd5` | `#c2410c` |
| C | `#e0f2fe` | `#0369a1` |
| B | `#ede9fe` | `#6d28d9` |
| A | `#fef3c7` | `#92400e` (+ ★) |

---

### 3. Caves Page (`/caves`)

**Filter bar:** Search + Mine dropdown + Item Type dropdown

**Mine Banner** (shown when a mine filter is selected):
- Pill-shaped info block with mine color dot, mine name in bold, and unlock requirement text
- Mine color system:

| Mine | Background | Text | Dot |
|------|-----------|------|-----|
| Earth    | `#fef3c7` | `#92400e` | `#d97706` |
| Water    | `#dbeafe` | `#1e40af` | `#3b82f6` |
| Wind     | `#d1fae5` | `#065f46` | `#10b981` |
| Fire     | `#fee2e2` | `#991b1b` | `#ef4444` |
| Memories | `#ede9fe` | `#5b21b6` | `#8b5cf6` |

**Cave Card:**
```
┌──────────────────────────┐
│ Sea Crystal    [Gem]     │
│ ● Water    [Floors 16–25]│
└──────────────────────────┘
```

**Card grid:** `minmax(210px, 1fr)`

---

### 4. Foraging Page (`/foraging`)

**Filter bar:** Search + Season + Area

**Foraging Card:**
```
┌───────────────────────────┐
│ Wild Mushroom   [Fall]    │
│ 📍 Deep Forest            │
│ [Forest]                  │  ← area tag: primaryXLight bg
└───────────────────────────┘
```

---

### 5. NPCs & Quests Page (`/npcs`)

**Filter bar:** Search (by name/role) + Role dropdown

**NPC Card (280px min-width):**
```
┌──────────────────────────────────┐
│ [LI]  Lily                       │  ← 48px avatar circle (npc.color bg)
│       [Botanist]                 │  ← role chip in primaryXLight
│                                  │
│ 📍 Greenhouse                    │
│    Greenhouse 7am–4pm · ...      │
│                                  │
│ LOVED GIFTS                      │
│ ♥ Rare Flowers  ♥ Honey  ♥ ...  │  ← rose-50 bg pills
│                                  │
│ 📜 Quest: Seeking exotic...      │  ← primaryXLight block
└──────────────────────────────────┘
```

**NPC avatar colors (per character):**
| Name | Color |
|------|-------|
| Sam | `#0369a1` |
| Lily | `#15803d` |
| Marcus | `#b45309` |
| Elena | `#9333ea` |
| Tidal | `#0f766e` |
| Naomi | `#dc2626` |
| Keanu | `#d97706` |
| Mira | `#ec4899` |

---

### 6. AI Guide (overlay, all pages)

**Floating button:** 52×52px circle, `position: fixed; bottom: 24px; right: 24px; z-index: 1001`
- Background: `THEME.primary` when closed, `var(--accent)` when open
- Icon: sparkles (closed) → X (open)
- Hover: `scale(1.1)` transition

**Chat panel:** `position: fixed; bottom: 88px; right: 24px; width: 380px; height: 500px`
- Slide-in animation: `translateY(20px) scale(0.94) → translateY(0) scale(1)`, `cubic-bezier(0.34,1.56,0.64,1)` 280ms
- `transform-origin: bottom right`

**Panel structure:**
1. **Header** (primary bg): Avatar circle + "Island AI Guide" / "Ask me anything" + Clear button + X
2. **Message area** (flex: 1, scrollable): renders empty state with 5 suggested question chips when no messages
3. **Input bar** (`background: #fafaf9`): text input + send button

**Chat bubbles:**
- User: right-aligned, `var(--accent-light)` bg, `border-radius: 14px 14px 4px 14px`
- AI: left-aligned with 26px sparkles avatar, `primaryXLight` bg, `border-radius: 4px 14px 14px 14px`
- Supports inline `**bold**` markdown

**Typing indicator:** 3 dots, `ciWave` animation (each dot staggers 0.16s)

**AI response logic:** See `ai-guide.jsx` → `getResponse()`. Keyword → response map in `lib/ai-responses.ts`. In production, swap for the server-backed Gemini AI guide.

---

## Interactions & Behavior

### Navigation
- Clicking a sidebar item sets `activePage` state → unmounts/remounts page → triggers `ciPageIn` fade
- "AI Guide" nav item toggles `chatOpen` boolean (does NOT change active page)
- Floating button also toggles `chatOpen`

### Filtering (all pages)
- Filters are additive AND logic (all active filters must match)
- Season filter: `'all'` items always pass the season check
- Clear button appears when any filter is active; resets all to `''`
- Result count updates live in the subtitle

### Card hover
- `transform: translateY(-2px)`
- Box shadow: `shadow → shadowHover`
- Border: `cardBorder → primaryLight`
- Transition: `0.18s` on transform, `0.2s` on shadow

### AI Chat
1. User submits message (Enter or send button)
2. Message appended to array, typing indicator shown
3. After 700–1300ms random delay, response appended, indicator removed
4. Message list scrolls to bottom on each update

---

## State Management

Each page owns its own filter state (no global store needed):

```ts
// Crops
const [season, setSeason] = useState('');
const [type,   setType]   = useState('');
const [rank,   setRank]   = useState('');
const [search, setSearch] = useState('');

// App-level
const [activePage, setActivePage] = useState<'crops'|'caves'|'foraging'|'npcs'>('crops');
const [chatOpen,   setChatOpen]   = useState(false);
```

For the Tweaks system (optional in production — this was a design-time feature):
```ts
const [accent,  setAccent]  = useState('#f97316');
const [radius,  setRadius]  = useState(12);
const [density, setDensity] = useState<'comfortable'|'compact'>('comfortable');
```

---

## Data Shapes

### Crop
```ts
interface Crop {
  id: number;
  name: string;
  type: 'Fruit' | 'Vegetable' | 'Grain' | 'Flower';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  rank: 'F' | 'E' | 'D' | 'C' | 'B' | 'A';
  growTime: number;    // days
  sellPrice: number;   // gold
  regrows: boolean;
}
```

### Cave Item
```ts
interface CaveItem {
  id: number;
  name: string;
  type: 'Mineral' | 'Gem' | 'Artifact' | 'Material';
  mine: 'earth' | 'water' | 'wind' | 'fire' | 'memories';
  floors: string;      // e.g. "1–10"
}
```

### Foraging Item
```ts
interface ForagingItem {
  id: number;
  name: string;
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
  location: string;
  area: 'Forest' | 'Plains' | 'Coastal' | 'Beach' | 'Lake';
}
```

### NPC
```ts
interface NPC {
  id: number;
  name: string;
  initials: string;
  role: string;
  location: string;
  schedule: string;
  lovedGifts: string[];
  quest: string;
  color: string;       // hex, used for avatar background
}
```

---

## Assets & Icons

**Fonts:** Google Fonts — `Playfair Display:wght@400;700` and `Inter:wght@300;400;500;600;700`

**Icons:** All icons are inline SVG (24×24 viewBox, `stroke="currentColor"`, `strokeWidth=1.75`). In the React implementation, use **Lucide React**:

```tsx
import { Leaf, Pickaxe, Sprout, Users, Sparkles, Clock, Coins, Heart, MapPin, ChevronDown, Send, X, Search } from 'lucide-react';
```

The prototype's hand-drawn SVG paths match Lucide's icon set exactly.

**No image assets** — all visuals are CSS/SVG. Avatar circles use colored backgrounds with initials.

---

## Animations

```css
/* Page transition — trigger by remounting the page component */
@keyframes ciPageIn {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Loading / typing dots */
@keyframes ciWave {
  0%, 60%, 100% { transform: translateY(0); }
  30%           { transform: translateY(-6px); }
}
/* Stagger: dot 0 = 0s delay, dot 1 = 0.16s, dot 2 = 0.32s */

/* AI chat panel slide-in */
/* Apply via inline style transform + opacity transition: */
/* closed: translateY(20px) scale(0.94), opacity 0 */
/* open:   translateY(0) scale(1), opacity 1 */
/* duration: 280ms cubic-bezier(0.34, 1.56, 0.64, 1) (spring bounce) */
```

---

---

## Screen 7: Login / Landing Page (`Login.html` → `/` or `/login`)

This is the **entry point** of the app — a split-layout page combining brand hero + AI search with a login form.

### Layout

Two-column flex row, `height: 100vh`, no scroll:

| Column | Width | Background |
|--------|-------|-----------|
| Left — Hero | `flex: 1 1 55%` | `linear-gradient(148deg, #071e1c, #0b3330, #134e4a)` |
| Right — Login | `flex: 0 0 420px` | `#fefce8` (cream) |

**Mobile (≤820px):** stacks vertically — hero on top (min-height 56vh), login form below (scrollable).

---

### Left Panel — Hero

**Background extras:**
- Subtle dot grid overlay: `background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)` repeated at 40×40px
- 3 animated radial gradient blobs (CSS `border-radius: 50%`, `radial-gradient`):
  - Blob 1: 520px, top-right, teal `rgba(15,118,110,0.3)`, `blob1` 14s animation
  - Blob 2: 360px, bottom-left, coral `rgba(249,115,22,0.12)`, `blob2` 18s animation
  - Blob 3: 220px, bottom-right, teal `rgba(94,234,212,0.07)`, `blob3` 11s animation
- All blobs use `pointer-events: none` and `z-index` behind content

**Blob animations (gentle float):**
```css
@keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(22px,-28px) scale(1.05)} }
@keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-18px,22px)  scale(0.95)} }
@keyframes blob3 { 0%,100%{transform:translate(0,0)}  40%{transform:translate(12px,14px)}  80%{transform:translate(-8px,-10px)} }
```

**Logo** (top-left, same as sidebar): 40×40px gradient mark + Playfair Display 16px "Coral Island" + "DATABASE" 10px uppercase `#5eead4`

**Headline:**
- "Your complete" — Playfair Display 700, `clamp(26px, 3.2vw, 46px)`, white
- "island" — italic, color `#f97316` (accent)
- "companion" — white
- Subtitle: 15px `rgba(255,255,255,0.55)`, max-width 420px

**Entry animations:** `fadeUp 0.5s ease` staggered — headline at 0s, search at 0.1s, chips at 0.2s

---

### Centralized AI Search Bar

The page's hero feature. Full spec:

**Filter chips** (above the input):
- 5 chips: All / Crops / Caves / Foraging / NPCs
- Inactive: `rgba(255,255,255,0.08)` bg, `rgba(255,255,255,0.55)` text
- Active: `rgba(255,255,255,0.22)` bg, white text, `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.3)`

**Search input pill:**
- Background: white, `border-radius: 18px`, `padding: 5px 5px 5px 18px`
- Left: sparkles icon (19px), changes to accent color on focus
- Center: text input, 15px Inter, placeholder cycles through 6 questions every 3.2s
- Right: X clear button (shown when query exists) + orange "Search" button (`border-radius: 13px`)
- Focus shadow: `0 0 0 3px rgba(249,115,22,0.5), 0 12px 40px rgba(0,0,0,0.28)`

**Results dropdown** (appears when ≥2 chars typed):
- `position: absolute`, `top: calc(100% + 8px)`, white bg, `border-radius: 14px`
- Max 8 results grouped across all 4 categories
- Each row: 32px colored category dot icon + name + subtitle + category pill
- Last row always: "Ask AI: [query]" with sparkles icon in `#f0fdfa` bg
- Hover: row bg → `#f0fdfa`
- `animation: fadeUp 0.14s ease` on appear

**Popular searches chips** (below search bar):
- 5 preset queries as ghost pill buttons
- Same styling as filter chips

---

### Right Panel — Login Form

**Header:** "New here? Create account" link (right-aligned, accent color)

**Greeting:**
- 🌴 emoji, Playfair Display 700 27px "Welcome back", 13.5px subtitle

**Form fields:**
- Label: 12.5px Inter 600 `#374151` uppercase tracking
- Input: `padding: 11px 12px 11px 38px` (icon-padded left), `border-radius: 10px`
- Icon: user (email) / lock (password) at left, 16px, `#9ca3af`
- Password toggle: eye/eyeOff icon at right
- Validation: red border `#fca5a5`, red bg `#fef2f2`, error text 11.5px `#dc2626`
- Focus border: `C.primary` (#0f766e)
- "Forgot password?" link: right-aligned, 12px teal

**Sign In button:** full-width, `background: #0f766e`, `border-radius: 10px`, 14.5px 600
- Loading state: spinner + "Signing in…" text, bg → `#5eead4`
- Spinner: 16px circle, `border-top-color: white`, `animation: spin 0.7s linear infinite`
- On success: navigate to `Coral Island Database.html`

**Divider:** `— or —` with hr lines

**Continue as Guest:** white bg, `border: 1.5px solid #e5e7eb`, arrow-right icon
- Hover: border → `#0f766e`, bg → `#f0fdfa`
- Navigates to main app immediately (no auth)

**Footer:** 11.5px gray "Terms and Privacy Policy" links

---

### Navigation Flow

```
Login.html ──[Sign In / Continue as Guest]──→ Coral Island Database.html
                                                      ↑
                                     (also reachable directly)
```

In production, add auth middleware that redirects unauthenticated users to `/login`.

---

## Files in This Bundle

| File | Purpose |
|------|---------|
| `Login.html` | Landing / login page — open this first |
| `Coral Island Database.html` | Main app — navigated to after sign-in or guest entry |
| `data.js` | All game data (crops, caves, foraging, NPCs, mine unlocks) |
| `ui-components.jsx` | Shared: THEME tokens, Icon, SeasonPill, RankBadge, MineBadge, TypeBadge, FilterSelect, EmptyState, LoadingDots |
| `sidebar.jsx` | Left sidebar + mobile bottom tab bar |
| `crops-page.jsx` | Crops page with filter logic + CropCard |
| `caves-page.jsx` | Caves page with MineBanner + CaveCard |
| `foraging-page.jsx` | Foraging page + ForagingCard |
| `npc-page.jsx` | NPC page + NPCCard |
| `ai-guide.jsx` | Floating button + chat panel + AI keyword-response engine |
| `app.jsx` | Root App component, page routing, tweaks wiring |
| `tweaks-panel.jsx` | Design-time Tweaks panel (not needed in production) |

---

## Notes for AI Coding Agents

1. **Start with the data layer** — move `data.js` contents into typed JSON/TS files under `src/data/`
2. **Implement the token system first** (`src/lib/theme.ts`) — every component references it
3. **Build shared UI components** (`Badge`, `FilterSelect`, etc.) before pages
4. **The Tweaks panel** (`tweaks-panel.jsx`) is a **design-time tool only** — skip it in production, but do implement the CSS variable system for `--accent` and `--radius` if you want user theming
5. **AI Guide in production** — replace `getResponse()` in `ai-guide.jsx` with a real API call. The UI/UX shell is complete; just swap the response function
6. **Game data accuracy** — the prototype uses representative data. Replace with accurate Coral Island data from a trusted source (wiki, game files) before shipping
7. **Search is client-side** — fine for a few hundred items. Add debouncing (`useDebounce`) for larger datasets
