# Astralyn: OCR and screenshot pipeline

## Current scope

The implemented screenshot flow supports Divergent Universe choice text. It runs Tesseract.js in a dedicated browser Web Worker, maps recognized text to canonical DU entities, and hands confirmed choices to the deterministic DU engine.

Roster screenshot import and stage/enemy screenshot recognition are not implemented.

## Runtime flow

```text
pasted or selected image
  |
  v
ImageData in browser memory
  |
  v
OffscreenCanvas grayscale and contrast preprocessing
  |
  v
Tesseract.js English recognition in a Web Worker
  |
  v
sanitized text lines
  |
  v
Fuse.js match against canonical DU names
  |
  v
user review or manual replacement
  |
  v
deterministic DU ranking
```

The worker is lazy-initialized when OCR is used. The main interface remains responsive while recognition runs.

## Matching boundary

OCR output is untrusted input. Astralyn:

- strips HTML tags and control characters;
- caps input length;
- matches against known blessings, equations, and curios;
- uses canonical record effects and tags after a match;
- never treats screenshot text as executable content or a knowledge mutation.

Low-confidence matches remain reviewable. Manual selection is the full fallback, not a hidden debug path.

## Privacy

- The image is processed in browser memory.
- The current implementation has no screenshot upload endpoint.
- Screenshot pixels are not written to D1.
- Active DU run state stores selected canonical IDs and configuration, not the source screenshot.

Tesseract language/model resources may be fetched by the library when the OCR worker initializes. That network activity is model loading, not screenshot upload.

## Failure states

- Worker unavailable: show OCR unavailable and keep manual selection active.
- Recognition error: show OCR failed and keep the image/manual workflow recoverable.
- No confident match: require user confirmation or replacement.
- Invalid persisted DU state: discard it during validated hydration.

## Test focus

Tests cover preprocessing, worker message flow, input sanitization, fuzzy matching, confidence labels, manual override, deterministic ranking, and local run persistence. They do not establish universal OCR accuracy across every HSR resolution or language.
