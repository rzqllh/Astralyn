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

#### Text & Typography (Contrast-Tested toward WCAG 2.2 AA)
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
## 5. Visual Hierarchy & Layering (Elevation Model)

- **Base Canvas (`z-0`, `#090C13`):** Dark cosmic void with subtle SVG radial grid.
- **Surface Panels (`z-10`, `#101524` / `#161E32`):** Primary analytical containers, card backgrounds, and module workspaces.
- **Light Contrast Dossier (`z-10`, `#EEE8DC`):** High-contrast celestial parchment for detailed character inspection and lore notes.
- **Floating HUD / Rails (`z-20`–`z-30`):** Sticky top status bar and left companion rail with `backdrop-blur-md`.
- **Modals / Toasts / Drawers (`z-40`–`z-50`):** Floating dialogs, toasts, tooltips, and mobile navigation overlays.

---

## 6. Anti-AI-Slop & Design Taste Rules

1. **Information Density with Purpose:** No empty card bloat. Every tile displays actionable metadata (rarity, element, path, Eidolon, level).
2. **Tabular Numerals for Numerical Stats:** All multipliers, levels, eidolon ranks, percentages, and timestamps use `font-mono tabular-nums`.
3. **Restricted Monospace:** Monospace font is strictly reserved for technical data and metrics; headings, navigation, and body copy use high-legibility sans-serif (`font-sans`).
4. **Honest System States:** Fixture data is clearly labeled (`Sample Output`, `Demo Data`, `(Illustrative Demo)`).
5. **No Decorative Clutter:** No gratuitous neon glow, excessive drop shadows, or ungrounded animations.
6. **High-Legibility Mobile Typography:**
   - Normal body text: 14–16px (`text-sm` / `text-base`);
   - Compact body text: 13–14px (`text-xs sm:text-sm`);
   - Secondary metadata / captions: 11–12px (`text-xs`);
   - 10px font size (`text-[10px]`): strictly limited to non-essential compact tags/chips (e.g. `Lv.80`, `E2`, `FIXTURE`).

---

## 7. Versioned Game Asset Pipeline, Optimization & Caching Strategy

- **Three-Tier Architecture:**
  1. *Full Catalog Schema Model:* Comprehensive schema supporting all 17 entity types across Honkai: Star Rail (`AssetEntityTypeSchema`).
  2. *Data-Driven Discovery & Sync Pipeline:* `tools/sync-assets.ts` with `--full` (dynamic upstream index discovery across 4300+ entities and 4500+ asset variant targets), `--dry-run` (non-destructive reporting distinguishing `catalog_discovered`, `mapped_subset`, and `not_yet_discoverable`), and default `--snapshot` (curated 51-asset dev subset).
  3. *Dev Snapshot:* Curated representative subset (51 assets across all 8 roster fixtures, 7 elements, 8 paths, light cones, relics, and DU items) checked into Git for local development.
  4. *Production Release:* Release-tagged immutable assets (`/game-assets/<release>/...`) served via Cloudflare Static Assets.
- **Context-Specific Sizing & Formats:**
  - *Character Previews:* 512x512px clean alpha PNG (~45–80 KB), high-resolution for tactical roster tiles and character profile hero.
  - *Character Icons:* 128x128px circular PNG (~10–25 KB), optimized for compact lists and HUD avatars.
  - *Combat Elements & Paths:* Crisp transparent PNGs (~2–8 KB), preserving exact silhouette alpha.
  - *Light Cones & Relics:* 256x256px crisp PNG (~20–40 KB).
- **Asset Loading Semantics:**
  - Same-origin static image loading;
  - Reserved dimensions and aspect-ratio containers to guarantee zero layout shift;
  - In-memory manifest lookups via `getAssetUrl(type, id, variant)` / `getAssetRecord()`;
  - Controlled asynchronous decode with automatic vector fallback rendering upon load error.
- **Cache Strategy & Invalidation Distinction:**
  - *Target Production Cache Policy:*
    - Versioned immutable asset binaries: `Cache-Control: public, max-age=31536000, immutable` (long-lived 1-year edge caching).
    - Release manifest (`manifest.json`): `Cache-Control: public, max-age=300, stale-while-revalidate=3600`.
  - *Verified Deployed Cache Behavior:*
    - Local development and preview environments verified via Vite same-origin static file serving.
    - Remote Cloudflare CDN edge header verification is deferred to Phase 9 production deployment.
- **Graceful Vector Fallback:** The `<GameAssetImage>` component automatically falls back to an accessible, non-broken Astralyn SVG vector silhouette upon load error or missing manifest entry without layout shift.
- **No Third-Party Runtime Hotlinking:** Runtime fetches to external GitHub/wiki repositories are strictly forbidden.
- **Conservative Provenance:** Game artwork is © COGNOSPHERE / HoYoverse. Repository automation licenses (AGPL-3.0) do not relicense underlying artwork. Assets are managed conservatively under the HoYoverse Fan Content Policy without asserting fair use as a legal conclusion.

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

1. **CharacterTile v2:** Tactical portrait tiles with real character artwork, Path & Element icons, rarity borders (5★ Gold / 4★ Violet), eidolon chips, level badges, and full keyboard accessibility (`role="button"` + `aria-pressed`).
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

Internal design system showcase (`/design-system`) is placed as a development-gated utility link in the bottom footer of the navigation rail (`isDev`).

---

## 11. Responsive Architecture

- **Desktop (1440px):** Persistent left rail (w-64), top HUD status bar, multi-column dashboard.
- **Tablet (768px):** Reflowed 2-column grid, responsive header, preserved touch targets.
- **Mobile (390px):** Single-column layout, top navigation bar with slide-out drawer, touch targets >= 44px, zero horizontal overflow (`100dvh` stability).

---

## 12. UI State & Fixture Boundaries

To prevent developer aids or demo data from being mistaken for production functionality, UI elements are classified according to strict operational boundaries:

| UI Element / State | Route / Location | Classification | Operational Intent |
|---|---|---|---|
| **Production Navigation (8 Links)** | Navigation Rail (`/`, `/roster`, etc.) | `production_valid` | Locked user-facing navigation structure. |
| **Dev DS Link** | Navigation Footer (`/design-system`) | `development_only` | Secondary link strictly for internal component inspection during development (`isDev` gated). |
| **Design System Showcase** | Route `/design-system` | `development_only` | Development testing and visual regression target; not exposed in primary user navigation. |
| **Trailblazer Identity Chip** | Top HUD Header | `fixture_only` | Explicit `FIXTURE` labeled user identity; replaced with authenticated profile in Phase 4. |
| **Companion Preview Badges** | Header & Assistant Nav (`Preview`) | `preview_only` | Indicates interactive companion preview milestone state. |
| **Astralyn Verdict Sample Output** | Home Recommendation Section | `fixture_only` | Honest indicator that displayed recommendation is static sample data before Phase 5 engine activation. |
| **(Illustrative Demo) Metric** | Score Gauge (`97% Score`) | `fixture_only` | Explicit disclosure on score gauge that numbers are representative demo values. |
| **Active Roster Fixtures (8 Chars)** | Home Roster Grid (`FIXTURE_CHARACTERS`) | `fixture_only` | Curated development dataset for UI verification; replaced by user-owned roster in Phase 4. |
| **Diagnostic Asset Release Metadata** | `/design-system` Tabs | `development_only` | Diagnostic release tagging (`v1.0.0`, `3.0.x`); excluded from end-user views. |
