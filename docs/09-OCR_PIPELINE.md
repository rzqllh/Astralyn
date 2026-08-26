# Astralyn — OCR & Screenshot Pipeline

## Goal

Read structured HSR screenshots cheaply and locally, then map recognized text to known game entities.

OCR is a sensor, not the recommendation engine.

## Primary implementation

- PaddleOCR.js
- PP-OCRv5
- browser/client inference
- Web Worker mode where stable
- Canvas / OffscreenCanvas preprocessing
- Fuse.js canonical entity matching

Alternative:
- Tesseract.js

Optional fallback:
- free-tier multimodal provider if enabled by app/user policy.

## Supported MVP intents

### Roster
Detect visible character names/portraits where practical and show candidates for confirmation.

### Divergent Universe
Identify Mask, Equation, Blessing, Curio and Event option names.

### Stage/enemy
Identify stage/enemy text and match known entities. Weakness-icon recognition can be added after text flow is reliable.

## Pipeline

```text
Clipboard / file
      ↓
Image normalization
      ↓
Intent/layout detection
      ↓
Region-of-interest crop
      ↓
Contrast/sharpen/scale
      ↓
PaddleOCR
      ↓
line text + polygon + score
      ↓
entity candidate extraction
      ↓
Fuse.js canonical matching
      ↓
confidence gate
      ↓
user correction if needed
      ↓
recommendation engine
```

## Entity matching

Do not depend on reading full effect descriptions perfectly.

Example:

OCR: `Unaging Mem0ry`  
Matcher: `Unaging Memory`, confidence 0.94.

Effect and tags come from the current Astralyn knowledge snapshot, not OCR text.

## Confidence tiers

Starting point:
- `>= 0.90` auto-match;
- `0.75–0.89` auto-select but visibly confirmable;
- `< 0.75` require user candidate selection.

Tune thresholds from fixtures, not vibes.

## Preprocessing profiles

Maintain separate profiles for:
- DU card title regions;
- roster grid;
- stage header;
- future content-specific layouts.

One universal preprocessing pipeline is unlikely to be optimal.

## Privacy

Default:
- screenshot stays in browser memory;
- no server upload;
- discard after processing unless user explicitly chooses otherwise.

Do not use Supabase Storage for screenshots in MVP.

## Performance

- lazy-load OCR only when needed;
- show model initialization progress;
- use Worker mode to keep UI responsive;
- cache model assets where licensing/distribution permits.

## Fallback

1. manual correction;
2. manual entity search/select;
3. optional free multimodal fallback.

The product must remain usable after step 2.
