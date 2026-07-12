---
name: document-scoring
description: Use when asked to document recommendation scoring rules, scoring examples, or docs/recommendation pages for this repository.
---

# Document Scoring

Create or update recommendation scoring documentation.

## Workflow

1. Create `docs/recommendation/[name-of-recommendation].md`.
2. Link the document from `README.md`.
3. Keep the document focused on the recommendation's scoring behavior, not implementation internals.

## Required Sections

Each recommendation scoring document must include these sections:

- `Overview`
- `Assumptions/Exclusions`
- `Rules`
- `Examples`

## Section Guidance

`Overview` explains what recommendation is being scored and what the score means.

`Assumptions/Exclusions` explains assumptions behind the recommendation and what is intentionally excluded from scoring.

`Rules` explains all scoring rules as a Markdown list. Include inputs, ranking behavior, hard caps, tie-breaking, unavailable-data behavior, and anything excluded from scoring.

`Examples` includes at least 3 concrete scoring examples. Include examples for extreme achievable scores, such as `0` and `100`, whenever the scoring rules can produce them. If an extreme score cannot be achieved from available scoring rules, reject the documentation change and require scoring improvements before documenting it.

Format each example as:

```md
### Example name

Conditions:

- Condition 1
- Condition 2

Score: <RecommendationScore>
```
