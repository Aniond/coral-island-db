# Auth Pages Handoff — Coral Island Database

Design + implementation handoff for the **Login** and **Create Account** screens.

---

## What's in this package

```
design_handoff_auth/
├── README.md                        ← this file
├── reference/
│   ├── Login.html                   ← pixel-perfect design reference (open in browser)
│   └── Register.html                ← pixel-perfect design reference (open in browser)
└── src/
    ├── App.jsx                      ← drop-in replacement for client/src/App.jsx
    └── pages/
        ├── LoginPage.jsx            ← drop-in replacement for client/src/pages/LoginPage.jsx
        └── RegisterPage.jsx         ← new file → client/src/pages/RegisterPage.jsx
```

---

## How to apply

### 1. Copy the three source files

```bash
# From the repo root
cp src/App.jsx             client/src/App.jsx
cp src/pages/LoginPage.jsx client/src/pages/LoginPage.jsx
cp src/pages/RegisterPage.jsx client/src/pages/RegisterPage.jsx
```

### 2. Verify the font is loaded

Both pages use **Playfair Display** + **Inter** from Google Fonts.
Check `client/index.html` has this in `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
```

### 3. Check the animations are in `index.css`

The existing `client/src/index.css` already has all required keyframes
(`blob1`, `blob2`, `blob3`, `fadeUp`, `spin`). Also add `checkPop` for the
register success state if it isn't there yet:

```css
@keyframes checkPop {
  0%   { transform: scale(0) rotate(-10deg); }
  70%  { transform: scale(1.15) rotate(3deg); }
  100% { transform: scale(1) rotate(0deg); }
}
```

### 4. Wire up real auth (replace the TODO comments)

Both pages have `// TODO:` comments where the mock `setTimeout` calls live.
Replace them with your auth provider of choice:

#### Email / password — Supabase example
```js
// LoginPage.jsx — inside handleSignIn()
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) { setErrors({ email: error.message }); setLoading(false); return; }
onEnter();

// RegisterPage.jsx — inside handleSubmit()
const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
if (error) { setErrors({ email: error.message }); setLoading(false); return; }
setSuccess(true);
setTimeout(() => onSuccess(), 1400);
```

#### Google OAuth — Supabase example
```js
// Both pages — inside the "Continue with Google" onClick
await supabase.auth.signInWithOAuth({ provider: 'google' });
```

#### Firebase example
```js
// Email sign-in
await signInWithEmailAndPassword(auth, email, password);

// Google OAuth
await signInWithPopup(auth, new GoogleAuthProvider());
```

---

## Routes added

| Path | Component | Notes |
|---|---|---|
| `/login` | `LoginPage` | Already existed — updated with Google button + `/register` link |
| `/register` | `RegisterPage` | **New** — add this route to `App.jsx` |
| `/app` | `AppShell` | Unchanged |

---

## What changed in LoginPage.jsx

| Area | Change |
|---|---|
| "Create account" link | Now uses `<Link to="/register">` (was `href="#"`) |
| After Sign In button | Added **Continue with Google** button |
| Continue as Guest | Demoted to quiet text-only link below Google |

---

## Design tokens (quick reference)

| Token | Value | Usage |
|---|---|---|
| `primary` | `#0f766e` | Buttons, focus rings, links |
| `dark` | `#134e4a` | Headings |
| `accent` | `#f97316` | CTA links, search button, hero italic |
| `cream` | `#fefce8` | Right panel background |
| `teal-light` | `#5eead4` | Logo sub, perk icons, scrollbar |
| `error` | `#dc2626` | Field error text |
| `error-bg` | `#fef2f2` | Field error background |
| `error-border` | `#fca5a5` | Field error border |

---

## Password strength rules (RegisterPage)

| Bars filled | Label | Hex |
|---|---|---|
| 1 | Weak | `#ef4444` |
| 2 | Fair | `#f97316` |
| 3 | Good | `#eab308` |
| 4 | Strong | `#22c55e` |

Scoring: +1 per rule — length ≥ 8, uppercase letter, digit, special character.

---

## Open the reference designs

Open `reference/Login.html` and `reference/Register.html` directly in any browser
for a live, interactive preview of the intended look and behaviour.
No build step required — they are self-contained.
