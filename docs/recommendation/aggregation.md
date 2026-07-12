# Recommendation Aggregation

## Overview

Recommendation Aggregation combines activity-specific scoring results for one Location. Each activity scorer returns Forecast
Days with a produced Recommendation Score or Recommendation Score Unavailable. Aggregation preserves those scorer outputs and
computes a Recommendation Average Score for each activity.

The Recommendation Average Score is an activity-level summary. It is not a replacement for day scores, and it is not
comparable across activities.

## Assumptions/Exclusions

- Aggregation assumes Location Lookup has already selected one supported Location.
- Aggregation assumes each activity scorer owns its own scoring rules and unavailable-data behavior.
- Aggregation excludes new activity scoring rules. It composes scorer output rather than inventing scores.
- Aggregation excludes missing-date synthesis. If a scorer does not return a Forecast Day, aggregation does not add it.
- Aggregation excludes cross-activity comparison. Skiing, surfing, outdoor sightseeing, and indoor sightseeing scores express
  different activity suitability meanings.
- Aggregation excludes Recommendation Reasons unless an activity scorer explicitly provides them.

## Rules

- Aggregation calls each activity scorer for the same Location.
- Aggregation produces per-day scorer output and one rounded Recommendation Average Score per configured activity.
- Aggregation includes every configured activity when computing Recommendation Average Scores.
- Aggregation produces Recommendation Average Score Unavailable for configured activities with no produced scores.
- Each activity result keeps Forecast Days returned by that scorer.
- A Forecast Day with a produced Recommendation Score keeps that score.
- A Forecast Day with Recommendation Score Unavailable remains present with no produced score.
- A Forecast Day with Recommendation Score Unavailable is not coerced to `0`.
- A Forecast Day with Recommendation Score Unavailable is not omitted when the scorer returned that day.
- Recommendation Average Score for one activity is the rounded arithmetic mean of produced Recommendation Scores from that
  activity's returned Forecast Days.
- Recommendation Average Score rounds to the nearest integer. Half values round up.
- Recommendation Average Score excludes Forecast Days with Recommendation Score Unavailable.
- Recommendation Average Score is unavailable when no returned Forecast Day has a produced Recommendation Score.
- Recommendation Average Score is not comparable across different activities.

## Examples

### Mixed scored and unavailable days

Conditions:

- Indoor sightseeing scorer returns Monday `80`, Tuesday Recommendation Score Unavailable, and Wednesday `40`.
- Aggregation preserves all three returned Forecast Days.
- Produced scores are `80` and `40`.

Score: Recommendation Average Score `60`

### No produced scores

Conditions:

- Skiing scorer returns Monday Recommendation Score Unavailable and Tuesday Recommendation Score Unavailable.
- Aggregation preserves both returned Forecast Days.
- No Forecast Day has a produced Recommendation Score.

Score: Recommendation Average Score Unavailable

### Tied scored days

Conditions:

- Outdoor sightseeing scorer returns Monday `70`, Tuesday `70`, and Wednesday `50`.
- Monday and Tuesday have equal produced Recommendation Scores.

Score: Recommendation Average Score `63`
