---
name: coral-island-db-theme
description: >
  Theme factory skill for the coral-island-db game companion app and any related
  artifacts — slides, docs, reports, HTML pages, or UI components. Includes 10
  pre-set professional themes PLUS a custom "Coral Island" theme that exactly
  matches the app's design tokens (ocean teal, warm coral, sandy cream, Playfair
  Display + Inter). Use this skill whenever the user wants to style any artifact
  for the Coral Island DB project, asks to apply a theme, wants a themed presentation
  or doc, or says "use the Coral Island theme / tropical theme / match the app style".
  Always prefer the Coral Island theme as the default suggestion for CIAPP work.
---

# Coral Island DB — Theme Factory Skill

Provides consistent, production-quality styling for any artifact in the coral-island-db
project and beyond. 11 themes total: 10 professional presets + 1 custom Coral Island
theme that matches the app's exact design tokens.

---

## Usage

1. **Show theme options**: Display `theme-showcase.pdf` so the user can browse the 10 preset themes visually. For CIAPP work, also mention the custom Coral Island theme (not in the PDF — show the spec below).
2. **Ask for their choice**: Confirm which theme to apply.
3. **Read the theme file**: Load the chosen theme from `themes/` directory.
4. **Apply**: Use the theme's colors and fonts consistently throughout the artifact.

---

## Available Themes

### 🌴 Custom — Coral Island DB (default for CIAPP work)
Matches the app's exact design tokens. Always suggest this first for coral-island-db artifacts.

| Role | Color | Hex |
|------|-------|-----|
| Primary | Ocean Teal | `#0f766e` |
| Dark bg / headings | Deep Teal | `#134e4a` |
| CTA / active | Warm Coral | `#f97316` |
| Page background | Sandy Cream | `#fefce8` |
| Borders / dividers | Teal Light | `#ccfbf1` |
| Card surface | White | `#ffffff` |

**Fonts**: Playfair Display Bold (headers) · Inter 400/500/600 (body)

Full spec: `themes/coral-island.md`

---

### Preset Themes (see `theme-showcase.pdf`)

| # | Name | Vibe | File |
|---|------|------|------|
| 1 | **Ocean Depths** | Professional, maritime, calming | `themes/ocean-depths.md` |
| 2 | **Sunset Boulevard** | Warm, vibrant, energetic | `themes/sunset-boulevard.md` |
| 3 | **Forest Canopy** | Natural, earthy, grounded | `themes/forest-canopy.md` |
| 4 | **Modern Minimalist** | Clean, grayscale, contemporary | `themes/modern-minimalist.md` |
| 5 | **Golden Hour** | Rich, warm, autumnal | `themes/golden-hour.md` |
| 6 | **Arctic Frost** | Cool, crisp, winter | `themes/arctic-frost.md` |
| 7 | **Desert Rose** | Soft, sophisticated, dusty | `themes/desert-rose.md` |
| 8 | **Tech Innovation** | Bold, modern, tech | `themes/tech-innovation.md` |
| 9 | **Botanical Garden** | Fresh, organic, garden | `themes/botanical-garden.md` |
| 10 | **Midnight Galaxy** | Dramatic, deep, cosmic | `themes/midnight-galaxy.md` |

---

## Applying a Theme

After the user confirms a theme:

1. Read the corresponding `themes/*.md` file for exact hex codes and font names.
2. Apply colors consistently:
   - Primary color → headings, buttons, active states, key accents
   - Dark color → backgrounds, sidebars, dark text
   - Accent/CTA color → call-to-action elements, highlights, badges
   - Light/cream color → backgrounds, card surfaces
3. Apply fonts:
   - Headers → the specified header font (bold weight)
   - Body text → the specified body font
4. Maintain contrast and readability throughout.
5. Keep the visual identity consistent — don't mix tokens from different themes.

---

## Coral Island Theme — Full Spec

For HTML artifacts, use these CSS variables:

```css
:root {
  --primary:        #0f766e;  /* ocean teal */
  --primary-dark:   #134e4a;  /* deep teal */
  --primary-light:  #ccfbf1;  /* teal-100 */
  --primary-xlight: #f0fdfa;  /* teal-50 */
  --accent:         #f97316;  /* warm coral */
  --accent-light:   #fff7ed;  /* orange-50 */
  --accent-border:  #fed7aa;  /* orange-200 */
  --page-bg:        #fefce8;  /* sandy cream */
  --card-bg:        #ffffff;
  --card-border:    #99f6e4;  /* teal-300 */
  --text-dark:      #134e4a;
  --text-mid:       #0f766e;
  --text-muted:     #6b7a74;
  --shadow:         0 1px 4px rgba(0,0,0,0.05);
  --shadow-hover:   0 8px 28px rgba(15,118,110,0.14);
  --radius:         12px;
}
```

For slide decks / docs, use:
- **Background**: `#fefce8` (sandy cream) or `#134e4a` (deep teal for dark slides)
- **Headings**: `#134e4a` on light bg · `#ccfbf1` on dark bg
- **Body text**: `#0f766e` on light bg · `#f0fdfa` on dark bg
- **Accent elements**: `#f97316`
- **Cards/panels**: `#ffffff` with `1px solid #99f6e4` border

---

## Custom Theme Generation

If none of the 11 themes fit, generate a new one:

1. Extract intent from the user's description (mood, industry, colors mentioned)
2. Choose 4–6 harmonious hex values: primary, dark, accent, background, border
3. Pick a font pairing appropriate to the tone (serif = warmth/editorial, sans = clean/modern)
4. Name it descriptively (e.g. "Lagoon Dusk", "Neon Arcade")
5. Present the spec for review before applying
6. Save as `themes/<kebab-name>.md` following the existing format

---

## Verification

After applying any theme to an artifact:

- [ ] All headings use the theme's header font and primary/dark color
- [ ] Body text uses the theme's body font at readable size (≥13px / 11pt)
- [ ] Background color matches the theme's page/slide background
- [ ] Accent color used consistently for CTAs, badges, and active states only
- [ ] No hardcoded colors from a different theme are present
- [ ] Contrast ratio ≥ 4.5:1 for all body text (WCAG AA)
- [ ] Cards/panels use the theme's card surface + border color
- [ ] Mobile/small viewport still readable if HTML artifact
- [ ] For CIAPP artifacts: CSS variables match the `--primary`, `--accent`, `--page-bg` values above
