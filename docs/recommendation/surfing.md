# Surfing Day Scoring

## Overview

Surfing Day Scoring scores how suitable each scored local day is for recreational intermediate surfing at one supported
Location. The Recommendation Score is an integer from 0 to 100 for surfing only: 100 means excellent surf suitability,
and 0 means unusable surfing conditions.

This document describes scoring data, not a ranked Activity Recommendation. A scored day returns only its local date and
score. GraphQL recommendation composition can decide later how to present, order, rank, or explain the scored days.

## Assumptions/Exclusions

- Scoring assumes a recreational intermediate surfer.
- Scoring assumes one supported Location, not a specific surf break inside that Location.
- Scoring assumes normalized Forecast fields and normalized Surf Conditions are available for the same Location-local
  date.
- Scoring uses the best surfable window inside each local day, but that window is not returned as output.
- Scoring excludes beach-specific exposure, break orientation, bottom shape, rip currents, crowds, lifeguard cover, board
  choice, user skill variation, and travel logistics.
- Scoring excludes cross-activity comparison; a Surfing Day Score should not be compared with skiing, sightseeing, or
  indoor sightseeing scores.
- Scoring excludes ranking behavior; returned days have no rank, no reason, no surf window, and no order contract.

## Rules

- Scoring uses normalized Forecast fields and normalized Surf Conditions only, not raw provider response shapes.
- Required Surf Conditions inputs are wave height, wave period, swell direction, wind direction, and tide.
- Required Forecast inputs are the normalized daily fields needed for safety and comfort, especially weather code,
  precipitation, wind speed, wind gust, temperature, snowfall, and sunshine.
- Wave height and wave period drive baseline surf suitability. Moderate surf with organized period scores highest for the
  assumed recreational intermediate surfer.
- Flat or near-flat surf scores poorly because there is little surf opportunity.
- Excessively large surf scores poorly or can be capped as unusable because it exceeds the recreational intermediate
  suitability boundary.
- Short-period wind chop lowers score even when wave height is present.
- Swell direction and wind direction do not drive exposure, onshore, or offshore scoring while the domain has only
  Location-level data and no break orientation.
- Tide is caution-only without break-specific tide preferences. Extreme tide can reduce or cap the score, but generic
  high-tide or low-tide preference is excluded.
- Weather affects safety and comfort after surf quality. Mild temperature, low precipitation, low snow, and calm wind can
  preserve a strong surf score. Rain, snow, uncomfortable temperature, or low sunshine can reduce it.
- Severe weather codes, thunderstorms, freezing precipitation, heavy precipitation, meaningful snowfall, extreme wind,
  severe gusts, extreme tide, or extreme surf can cap or veto the score regardless of favorable wave conditions.
- A day missing required Surf Conditions is omitted rather than scored as 0.
- A day missing the required Forecast data is omitted rather than scored as 0.
- If no days can be scored for a known Location, Surfing Day Scoring is unavailable rather than an empty set of bad
  scores.
- Returned scored days have no ranking behavior. Ordering carries no meaning, and tie-breaking is not defined.
- Recommendation Scores are not comparable across different activities.

## Examples

### Clean moderate surf

Conditions:

- Wave height 1.5 m.
- Wave period 11 s.
- Swell and wind directions are available but not used for exposure scoring.
- Tide is not extreme.
- Mild temperature, no precipitation, no snowfall, light wind, and low gusts.
- Surf is organized and within the recreational intermediate range.

Score: 88

### Borderline small surf

Conditions:

- Wave height 0.6 m.
- Wave period 8 s.
- Swell and wind directions are available but not used for exposure scoring.
- Tide is not extreme.
- Dry weather, mild temperature, and low wind.
- Conditions are safe and clean, but surf size and period are weak.

Score: 52

### Messy wind-chop day

Conditions:

- Wave height 1.2 m.
- Wave period 5 s.
- Swell and wind directions are available but not used for exposure scoring.
- Tide is not extreme.
- Noticeable wind, stronger gusts, light rain, and little sunshine.
- Wave height exists, but short period and windy weather make surf quality poor.

Score: 30

### Safety-veto storm surf

Conditions:

- Wave height 2.0 m.
- Wave period 12 s.
- Swell and wind directions are available but not used for exposure scoring.
- Tide is extreme.
- Thunderstorm weather code, heavy precipitation, strong wind, and severe gusts.
- Surf energy is present, but safety conditions cap the day as unusable.

Score: 5

### Surf data unavailable

Conditions:

- Forecast Day exists for the local date.
- Required Surf Conditions are missing for the same local date.
- Surf suitability is unknown, not known bad.

Score: Recommendation Score Unavailable
