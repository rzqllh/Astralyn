# Astralyn — Design System & UX Direction

## 1. Design Objective

Astralyn is an **HSR-native companion tool**, built to feel immediately natural and intuitive to a Honkai: Star Rail player without copying proprietary game assets or falling into generic AI SaaS tropes.

The design borrows HSR's information hierarchy, panel composition, navigation rhythm, character-first presentation, rarity emphasis, sci-fi material language, cream/gold/dark-blue relationship, layered modal behavior, tab/selection patterns, dense-but-readable stats, and high-value motion.

Astralyn maintains:
- Original celestial branding and vector emblem lockups;
- Versioned static game asset pipeline (StarRailRes release v1.0.0 via Cloudflare Static Assets);
- Original accessible component implementations (Radix UI primitives + Tailwind CSS v4);
- Responsive web accessibility targeting WCAG 2.2 AA.

---

## 2. Anti-AI-Slop Rules

Strictly rejected:
- Random purple/blue neon gradients as the interface identity;
- Endless identical rounded cards stacked inside each other;
- Excessive, performance-degrading glassmorphism;
- Neon borders on every surface;
- Oversized marketing hero copy inside utility screens;
- Irrelevant dashboard KPI cards;
- Badge/icon clutter without purpose;
- Decorative particles without functional value;
- Generic SaaS sidebar patterns;
- Identical radius/elevation across disparate components.

Every decorative element must serve hierarchy, interaction feedback, game context, or Astralyn branding.

---

## 3. Concrete Design Tokens

### Color Palette

#### Surfaces
- `surface.base`: `#090C13` (Deep Cosmic Void)
- `surface.raised`: `#101524` (Primary Utility Surface)
- `surface.overlay`: `#161E32` (Elevated Panel Surface)
- `surface.sunken`: `#05070A` (Background Sunken Well)
- `surface.parchment`: `#EEE8DC` (Warm Celestial Parchment for item/lore detail)
- `surface.parchment-raised`: `#F7F3EC`
- `surface.parchment-border`: `#D4CCBD`

#### Text & Typography (WCAG 2.2 AA Compliant)
- `text.primary`: `#F0F3FA` (High-contrast white, 16.5:1 on base)
- `text.secondary`: `#9BA5BE` (Muted information, 6.5:1 on base)
- `text.muted`: `#8E9CB5` (Subtle metadata, > 5.0:1 on base)
- `text.inverse`: `#0D111A` (Dark text on gold/parchment)
- `text.gold`: `#E5C179` (Astral metallic text)
- `text.parchment.primary`: `#181D28` (> 10:1 on parchment)
- `text.parchment.secondary`: `#565F75` (> 4.8:1 on parchment)
- `text.parchment.accent`: `#634812` (> 5.5:1 on parchment)

#### Gold Semantic Token Split
- `gold.brand`: `#DFB86C` (Astralyn brand emblem and identity)
- `gold.action`: `#DFB86C` (Interactive primary buttons, focus rings)
- `gold.action-hover`: `#F3D48F` (Hover shimmer)
- `gold.rarity`: `#D89F37` (5★ character/light cone framing)
- `gold.verdict`: `#F4D38F` (Astralyn Verdict header and match badges)
- `gold.glow`: `rgba(223, 184, 108, 0.28)`

#### Borders
- `border.subtle`: `rgba(155, 165, 190, 0.12)`
- `border.medium`: `rgba(155, 165, 190, 0.24)`
- `border.strong`: `rgba(155, 165, 190, 0.40)`
- `border.gold`: `rgba(223, 184, 108, 0.45)`
- `border.gold.solid`: `#DFB86C`

#### Status Tokens
- `status.success`: `#34D399` (Emerald)
- `status.warning`: `#FBBF24` (Amber)
- `status.danger`: `#F87171` (Coral Red)
- `status.info`: `#38BDF8` (Sky Blue)

#### Game-Context Tokens
- **Rarity 5★:** Base `#D89F37`, Background `rgba(216, 159, 55, 0.14)`
- **Rarity 4★:** Base `#9D7FE6`, Background `rgba(157, 127, 230, 0.14)`
- **Physical:** `#ABB2BF`
- **Fire:** `#F87171`
- **Ice:** `#38BDF8`
- **Lightning:** `#C084FC`
- **Wind:** `#34D399`
- **Quantum:** `#818CF8`
- **Imaginary:** `#FBBF24`

---

## 4. Typography Scale & Semantic Rules

- **Display Header:** 28–32px Black (`tracking-tight`, uppercase, gold gradient support)
- **Section Heading:** 18–20px Bold (`text-[#F0F3FA]`)
- **Entity Title:** 14–16px Semibold (`text-[#F0F3FA]`)
- **Body:** 13–14px Regular (`text-[#9BA5BE]`, leading-relaxed)
- **Compact Body / Metadata:** 11–12px Regular (`text-[#9BA5BE]`)
- **Strict Monospace Rule:** Monospace (`font-mono`) is strictly restricted to numerical stats, multipliers, Eidolon levels (`E2`), character levels (`Lv.80`), match scores (`97%`), timestamps, and technical IDs. General UI labels and headings use sans-serif.

Font stack:
- Sans: `'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Mono: `'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace`

---

## 5. Geometry & Corner Treatment

- **Utility Panels:** Chamfered corners via `.clip-chamfer-sm` (6px 45-degree corner cuts) or subtle 2px rounded corners (`rounded-xs`/`rounded-sm`).
- **Accent Frames:** Asymmetrical 45-degree top-right gold corner markers on highlight panels.
- **Badges & Tags:** `.clip-tag` with 8px angular corner cut.
- **Buttons:** 2px rounded corners with bevel gradient borders.

---

## 6. Elevation & Depth Layers

- **Layer 0 (Void):** `#090C13` base with 32px HUD grid pattern (`.hsr-grid-pattern`).
- **Layer 1 (Navigation & HUD):** Left navigation rail (`#0B0E17`/95) and sticky top bar with backdrop blur.
- **Layer 2 (Workspaces & Panels):** Surface raised (`#101524`) and parchment detail panels (`#EEE8DC`).
- **Layer 3 (Active / Selection):** Gold framed highlight (`border-[#DFB86C]`, shadow glow `0 0 16px rgba(223,184,108,0.4)`).
- **Layer 4 (Overlays & Modals):** Dialog modal (`#0F1422` with 75% dark backdrop blur).

---

## 7. Versioned Game Asset Pipeline & Resilience

- **Static Asset Serving:** Game assets are statically served via `/game-assets/<release>/` directly through Cloudflare Static Assets.
- **No Third-Party Runtime Hotlinking:** Runtime fetches to external GitHub/wiki repositories are strictly forbidden.
- **Graceful Vector Fallback:** The `<GameAssetImage>` component automatically falls back to an accessible, non-broken Astralyn SVG vector silhouette upon load error or missing manifest entry without layout shift.
- **Entity Coverage:** 17 normalized asset types supported (character icons, character previews, element icons, path icons, light cones, relic sets, DU curios, DU blessings).

---

## 8. Foundational UI Primitives

1. **Button / IconButton:** Primary Gold, Secondary Navy, Outline, Ghost, Danger, and Parchment variants.
2. **Panel:** Layered container supporting default, raised, sunken, highlight, and parchment styles.
3. **SectionHeader:** HSR diamond emblem with category badge, title, subtitle, and action slots.
4. **Tabs:** Radix-powered accessible tabs with metallic gold sliding underline.
5. **Badge / Tag:** Status, Rarity (5★/4★), Element, and Confidence indicators.
6. **Input / Select:** Accessible form controls with validation and helper text.
7. **Dialog / Modal:** Radix-powered focus-trapped dialogs with gold corner accents.
8. **Tooltip:** Accessible hover/focus tooltips.
9. **Toast:** Contextual transient feedback provider.
10. **Divider:** Tapered line separator with central gold diamond motif.
11. **Skeleton / EmptyState:** Shimmering async loaders and contextual zero-data views.
12. **GameAssetImage:** Asset-manifest backed image loader with fallback resilience.

---

## 9. Foundational Domain Components

1. **CharacterTile v2:** Tactical portrait tiles with real character artwork, Path & Element icons, rarity borders (5★ Gold / 4★ Violet), eidolon chips, level badges, and full keyboard/WAI-ARIA accessibility (`role="button"` + `aria-pressed`).
2. **RecommendationPanel:** Visualizes the "ASTRALYN VERDICT", #1 Best Fit recommendation, percentage match gauge, confidence tier, and rationale checklist with honest demo labels.
3. **SourceRankPanel:** 3-source consensus matrix (Prydwen, Game8, Theorycraft) with transparent community disclaimer and sample layout disclosures.
4. **DecisionCard:** Fast Divergent Universe decision card providing instant "PICK [X]" clarity, why-to-pick bullets, and why-not-alternatives trade-offs.

---

## 10. Locked Production Navigation Contract

The user-facing navigation rail strictly exposes 8 production modules:
1. `Home` (`/`)
2. `Roster` (`/roster`)
3. `Characters` (`/characters`)
4. `Best Characters` (`/best-characters`)
5. `Teams` (`/teams`)
6. `Content` (`/content`)
7. `Assistant` (`/assistant`)
8. `Settings` (`/settings`)

Internal design system showcase (`/design-system`) is placed as a secondary developer utility link in the bottom footer of the navigation rail.

---

## 11. Responsive Architecture

- **Desktop (1440px):** Persistent left rail (w-64), top HUD status bar, multi-column dashboard.
- **Tablet (768px):** Reflowed 2-column grid, responsive header, preserved touch targets.
- **Mobile (390px):** Single-column layout, top navigation bar with slide-out drawer, touch targets >= 44px, zero horizontal overflow (`100dvh` stability).
