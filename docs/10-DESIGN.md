# Astralyn: design and UX contract

## Direction

Astralyn is a dense game companion, not a general analytics dashboard. The interface uses dark navy surfaces, restrained gold action accents, compact metadata, and character-first hierarchy without copying the game client layout.

The current implementation uses React, Tailwind CSS, and Radix primitives. It supports desktop navigation, a mobile drawer, keyboard interaction, reduced-motion handling, loading states, empty states, and error states.

## Visual rules

- Use gold for brand identity, primary action, focus, and recommendation emphasis.
- Reserve rarity colors for rarity meaning.
- Keep body text readable against dark surfaces; do not use low-contrast metadata for essential instructions.
- Use monospace only for levels, Eidolons, scores, timestamps, and technical IDs.
- Prefer compact panels with visible hierarchy over repeated decorative cards.
- Avoid generic neon gradients, pervasive glass effects, ornamental particles, and unrelated dashboard metrics.
- Use motion only for state transition or interaction feedback.

The concrete values live in `apps/web/src/styles.css` and component classes. Code is authoritative when this prose and the implementation differ.

## Component behavior

- Buttons expose loading, disabled, focus, and destructive variants.
- Dialogs trap focus and close through expected keyboard controls.
- Character controls expose selection state to assistive technology.
- Images reserve dimensions and fall back without layout shift.
- Recommendation results distinguish primary result, alternatives, reasons, evaluation counts, and Limited Data state.
- Empty and error states explain the recovery action instead of showing an empty frame.

## Production routes

| Route | Current state |
| --- | --- |
| `/` | Knowledge status and product entry points |
| `/roster` | Authenticated roster management |
| `/onboarding` | Authenticated initial roster setup |
| `/characters` | 92-character catalog |
| `/characters/:characterId` | Character dossier and focused recommendation entry |
| `/best-characters` | Role-oriented character matrix without fabricated tiers |
| `/teams` | Authenticated saved teams |
| `/recommendations` | All Characters and My Roster team recommendations |
| `/assistant` | Divergent Universe setup, OCR/manual choices, and results |
| `/content` | Explicit unavailable placeholder |
| `/settings` | Explicit unavailable placeholder |

The navigation currently exposes eight primary links. `/recommendations` is reached through recommendation actions rather than a separate rail item.

## Development-only surfaces

`design-system.html` is a separate Vite entry and is not a production router route. Its navigation link appears only in development unless explicitly enabled.

The repository contains 52 `manual_review` game asset records for development inspection. Production source cannot import them, and production routes use fallback silhouettes. Do not use a local development screenshot as evidence that artwork ships in the production build.

## Responsive contract

- Desktop: persistent side navigation and multi-column content where useful.
- Tablet: grids reduce columns without hiding primary actions.
- Mobile: single-column content, drawer navigation, no horizontal page overflow, and touch targets sized for direct interaction.

Exact breakpoint behavior is enforced in components and Playwright coverage rather than fixed to a single showcase viewport.

## Accessibility claims

Automated Playwright checks use Axe on covered routes and states. Passing those checks means no configured automated violations were found there; it is not a blanket WCAG certification.

Manual review remains necessary for keyboard order, visible focus, dialog behavior, screen-reader names, contrast, zoom/reflow, touch targets, and reduced motion.

## Honest state rules

- Never render fixture recommendations as live results.
- Never show an ownership badge for a canonical-only character.
- Label incomplete taxonomy as Limited Data.
- Label unavailable editorial comparison and unfinished modules directly.
- Keep auth configuration errors separate from knowledge-loading errors.
- Do not imply that all 92 characters are simultaneously scored when the bounded candidate stage selects at most 16.
