# Astralyn — Design System & UX Direction

## 1. Design Objective

Astralyn is an **HSR-native companion tool**, built to feel immediately natural and intuitive to a Honkai: Star Rail player without copying proprietary game assets or falling into generic AI SaaS tropes.

The design borrows HSR's information hierarchy, panel composition, navigation rhythm, character-first presentation, rarity emphasis, sci-fi material language, cream/gold/dark-blue relationship, layered modal behavior, tab/selection patterns, dense-but-readable stats, and high-value motion.

Astralyn maintains:
- Original celestial branding and vector emblem lockups;
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

#### Text & Typography
- `text.primary`: `#F0F3FA` (High-contrast white)
- `text.secondary`: `#9BA5BE` (Muted information)
- `text.muted`: `#626E89` (Subtle metadata)
- `text.inverse`: `#0D111A` (Dark text on gold/parchment)
- `text.gold`: `#E5C179` (Astral metallic text)
- `text.parchment.primary`: `#181D28`
- `text.parchment.secondary`: `#565F75`

#### Astral Gold & Accents
- `gold.primary`: `#DFB86C` (Primary metallic accent)
- `gold.light`: `#F3D48F` (Highlight shimmer)
- `gold.dark`: `#A8813A` (Deep bevel shade)
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

## 4. Typography Scale

- **Display Header:** 28–32px Bold / Black (`tracking-tight`, uppercase, gold gradient support)
- **Section Heading:** 18–20px Bold (`text-[#F0F3FA]`)
- **Entity Title:** 14–16px Semibold (`text-[#F0F3FA]`)
- **Body:** 13–14px Regular (`text-[#9BA5BE]`, leading-relaxed)
- **Compact Body / Metadata:** 11–12px Regular (`text-[#626E89]`, font-mono)
- **Stat / Numeric Multipliers:** `font-mono tabular-nums font-bold text-[#DFB86C]`

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

## 7. Motion & Transition Standards

- **Micro Interactions (hover, active press):** 120–180ms ease-out (`active:scale-[0.98]`).
- **Panel & Tab Transitions:** 180–260ms cubic-bezier(0.16, 1, 0.3, 1).
- **Scene / Drawer Transitions:** 260–320ms.
- **Reduced Motion:** All transitions and skeleton shimmers automatically collapse to static styles under `@media (prefers-reduced-motion: reduce)`.

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

---

## 9. Foundational Domain Components

1. **CharacterTile:** Tactical portrait tiles with rarity borders (5★/4★), element tags, eidolon/trial badges, and accessible selection states (`aria-selected`).
2. **RecommendationPanel:** Visualizes the "ASTRALYN VERDICT", #1 Best Fit recommendation, percentage match gauge, confidence tier, and rationale checklist.
3. **SourceRankPanel:** 3-source consensus matrix (Prydwen, Game8, Theorycraft) with patch version, updated timestamp, and transparent community disclaimer.
4. **DecisionCard:** Fast Divergent Universe decision card providing instant "PICK [X]" clarity, why-to-pick bullets, and why-not-alternatives trade-offs.

---

## 10. Responsive Architecture

- **Desktop (1440px):** Persistent left rail (w-64), top HUD status bar, multi-column dashboard.
- **Tablet (768px):** Reflowed 2-column grid, responsive header, preserved touch targets.
- **Mobile (390px):** Single-column layout, top navigation bar with slide-out drawer, touch targets >= 44px, zero horizontal overflow (`100dvh` stability).
