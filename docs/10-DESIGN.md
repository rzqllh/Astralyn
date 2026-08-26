# Astralyn — Design System & UX Direction

## 1. Design objective

Astralyn should feel immediately familiar to a Honkai: Star Rail player.

The design should strongly borrow HSR's information hierarchy, panel composition, navigation rhythm, character-first presentation, rarity emphasis, sci-fi material language, cream/gold/dark-blue relationship, layered modal behavior, tab/selection patterns, dense-but-readable stats and high-value motion.

Astralyn still uses its own branding, implementation and original UI asset system. Do not make a pixel-for-pixel clone or redistribute proprietary UI sprites.

Target feeling: **HSR-native companion tool**, not generic dark gaming dashboard.

## 2. Anti-AI-slop rules

Reject:
- random purple/blue gradients as the whole identity;
- endless identical rounded cards;
- excessive glassmorphism;
- neon borders on every surface;
- oversized marketing hero copy inside utility screens;
- irrelevant dashboard KPI cards;
- badge/icon clutter;
- decorative particles without purpose;
- generic SaaS sidebar patterns;
- identical radius/elevation on every component.

Every decorative element must support hierarchy, interaction state, game context or Astralyn branding.

## 3. Visual language

### Surfaces
Primary: deep navy/charcoal utility surface.  
Secondary: warm pale/cream information panels where appropriate.  
Accent: restrained gold/champagne for importance and selection.  
Context accents: controlled Path/element/rarity color, never at the expense of contrast.

### Geometry
Use layered rectangular panels, selectively clipped/angled corners, slim dividers, offset headers and framed selected states.

Avoid turning every object into a floating rounded rectangle.

### Depth
1. background/world layer;
2. navigation;
3. primary working panel;
4. selected/highlighted item;
5. modal/decision overlay.

Hierarchy must still work with blur/glow disabled.

## 4. Typography

- highly readable body text;
- display treatment for major titles;
- compact metadata;
- tabular numerals for stats when useful;
- restrained all-caps.

Hierarchy:
page title → section title → entity name → recommendation label → body → metadata/source.

## 5. Navigation

Desktop:
- HSR-inspired persistent left navigation rail/layered menu;
- strong page title/header region;
- main information panel.

Mobile:
- compact bottom/overlay navigation;
- content first;
- never squeeze a desktop rail into a miniature.

Primary modules:
- Home
- Roster
- Characters
- Best Characters
- Teams
- Content
- Assistant
- Settings

## 6. Onboarding

Roster selection should feel like character selection, not a spreadsheet form.

Requirements:
- portrait grid;
- strong selected state;
- filters/search;
- selected count;
- confirmation summary;
- quick scanning.

Do not force detailed build inputs before the user reaches the product.

## 7. Character page

First view prioritizes character identity/art + practical answer.

Suggested hierarchy:

```text
Character identity / art
↓
Astralyn Verdict
↓
Build / Team / LC / Relic tabs
↓
3-source comparison
↓
Kit / Trace / Eidolon / detailed guide
```

Do not bury recommendations below lore.

## 8. Recommendation component

```text
ASTRALYN VERDICT

#1 Best Fit
[team/build]

94 Match
High confidence

✓ reason one
✓ reason two
✓ reason three
```

Then show #2, #3 and source comparison.

Each source panel shows patch and update date. Editorial Source #1 must never visually masquerade as official HoYoverse data.

## 9. DU screenshot assistant

Speed first.

Desktop:
- screenshot/choices left;
- recommendation right;
- run state secondary/collapsible.

Mobile:
1. screenshot;
2. Pick X;
3. why;
4. why not alternatives;
5. confirm choice.

This should not look like a chatbot transcript.

## 10. Motion

Categories:
- navigation transition;
- selection confirmation;
- panel reveal;
- recommendation emphasis;
- character/background parallax only when it adds identity.

Baseline:
- micro state ~120–180ms;
- panel ~180–260ms;
- major scene ~260–420ms.

Respect `prefers-reduced-motion`.

## 11. Responsive targets

Prioritize:
- desktop around 1440px gameplay-companion use;
- laptop;
- mobile portrait.

Screenshot assistant must work well as a second-screen mobile tool.

## 12. Accessibility

Baseline:
- WCAG 2.2 AA for functional text/controls;
- visible keyboard focus;
- semantic tabs/buttons;
- Path/element/state not communicated by color alone;
- reduced motion;
- usable target sizes;
- accessible source/freshness metadata.

HSR inspiration is not permission to put gold text on beige and call it premium.

## 13. Branding

Name: **Astralyn**

Personality:
- precise;
- tactical;
- elegant sci-fi;
- companion, not mascot-heavy;
- confident without sounding like a generic chatbot.

Logo direction:
- original celestial/navigation motif;
- avoid copying Astral Express, Trailblaze emblem, Path icons or proprietary marks.

## 14. Asset policy

Prefer:
- original Astralyn UI assets;
- permitted game reference assets under reviewed usage policy;
- optimized WebP/AVIF.

Do not bundle ripped game UI sprite sheets/textures as the design system.

## 15. Required design deliverables before UI build

- color tokens;
- typography tokens;
- spacing scale;
- corner/radius system;
- border/elevation system;
- motion scale;
- iconography rules;
- desktop nav;
- mobile nav;
- character card;
- roster selection card;
- recommendation card;
- source comparison;
- screenshot paste/upload state;
- DU decision state;
- loading/empty/error/stale states.

These must become concrete component/token specs, not a paragraph saying “futuristic premium”.
