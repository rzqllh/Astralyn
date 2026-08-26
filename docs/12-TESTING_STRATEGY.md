# Astralyn — Testing Strategy

## Goal

Recommendation correctness and knowledge freshness are first-class quality targets. A pretty interface recommending nonsense is merely a more expensive form of nonsense.

## Unit tests

### Scoring
- role coverage;
- tag synergy;
- anti-synergy;
- source weighting;
- freshness weighting;
- confidence.

### Reason codes
Every meaningful contribution/penalty should emit expected reasons.

### Availability
- owned;
- trial;
- unavailable.

## Golden recommendation fixtures

Example:

```json
{
  "name": "castorice-core-owned-plus-trial",
  "patch": "4.4",
  "roster": ["castorice", "cyrene", "luocha"],
  "trial": ["evernight", "hyacine"],
  "request": {"type": "team", "subject": "castorice"},
  "expectedTopContains": [
    ["castorice", "cyrene", "evernight", "hyacine"]
  ]
}
```

Review fixtures when mechanics, engine weights or source consensus changes.

## Ingestion tests

Per adapter:
- source fixture;
- parser snapshot;
- missing fields;
- layout change;
- malformed source;
- stale source;
- unchanged hash.

Never test only against live websites.

## Knowledge validation before publish

- unique IDs;
- no orphan references;
- valid Path/element enums;
- recommendation ranks 1–3;
- source metadata present;
- patch compatibility valid;
- current sets reference existing entities.

## OCR tests

Fixtures:
- 1080p;
- resized mobile;
- compressed JPEG;
- Indonesian UI;
- English UI if supported;
- cropped DU cards;
- low contrast;
- common OCR substitutions.

Track exact match accuracy, top-3 candidate accuracy and processing time.

## E2E critical path

1. login;
2. roster onboarding;
3. edit roster in Settings;
4. view character + source comparison;
5. get personalized Top 1–3 team;
6. create DU run;
7. paste screenshot;
8. choose recommendation;
9. reload and preserve run.

## Security tests

- Worker authorization tests: authenticated user cannot read or edit another user's roster or saved teams;
- unauthenticated API calls return 401 Unauthorized;
- client-supplied `user_id` in request body/query is rejected/ignored in favor of `session.user.id`;
- client endpoints cannot execute writes on canonical Game Knowledge tables;
- screenshot OCR text cannot trigger privileged backend actions;
- secrets (`BETTER_AUTH_SECRET`, publishing tokens) absent from client bundles.

## Visual regression

Focus on structural contracts:
- nav;
- character header;
- source comparison;
- Astralyn Verdict;
- roster grid;
- DU recommendation.

## Accessibility

Automated checks where practical plus manual keyboard, focus order, reduced motion, contrast, touch target and non-color-label tests.
