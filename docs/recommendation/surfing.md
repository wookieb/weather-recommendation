# Surfing Recommendation

## Overview

Surfing scores how suitable each scored day is for recreational surfing at one supported coastal Location. The
Recommendation Score is an absolute integer from 0 to 100 for surfing only: 100 means excellent surf suitability, and 0
means known unsuitable surf conditions.

The recommendation ranks next-7-day entries that have an available Recommendation Score. A day with unknown surf data has
Recommendation Score Unavailable and is excluded from the ranked result rather than scored as 0.

## Assumptions/Exclusions

- Surfing assumes a recreational intermediate surfer at one supported coastal Location.
- Scoring assumes normalized daily Forecast fields and normalized Surf Conditions Day fields are available for the same
  Location-local date.
- Scoring treats wave and swell signals as core suitability factors. Land weather affects comfort and safety but does not
  replace surf data.
- Scoring excludes tides, ocean currents, sea-surface temperature, beach crowding, hazards, lifeguard cover, board choice,
  skill-specific preferences, and exact surf-break orientation.
- Scoring excludes hourly best-window selection inside a day. One score represents day-level suitability.
- Scoring excludes navigation-grade marine safety decisions; Surf Conditions support recommendation ranking only.
- Scoring excludes cross-activity comparison; a Surfing score should not be compared with skiing, sightseeing, or indoor
  sightseeing scores.

## Rules

- Scoring uses normalized Forecast and Surf Conditions Day fields only, not raw Open-Meteo response shapes.
- Required surf inputs are max wave height in meters, max wave period in seconds, dominant wave direction in degrees from
  north, max swell wave height in meters, max swell wave period in seconds, dominant swell direction in degrees from north,
  and max wind-wave height in meters.
- Required weather inputs are the normalized daily Forecast fields needed for comfort and safety, especially weather code,
  precipitation, wind speed, wind gust, temperature, snowfall, and sunshine.
- Missing Surf Conditions Day for a date means surf conditions are unknown for that date. The day receives Recommendation
  Score Unavailable and is excluded from the ranked surfing result.
- Missing Forecast Day for a date means weather conditions are unknown for that date. The day receives Recommendation Score
  Unavailable and is excluded from the ranked surfing result.
- Wave and swell size drive baseline surf suitability. Small but present waves are borderline. Moderate waves score best
  for the assumed recreational surfer. Flat conditions and excessively large surf score poorly or can be unusable.
- Period quality adjusts the baseline. Longer swell periods improve score because they indicate more organized surf.
  Short-period wind chop lowers score even when height is present.
- Swell quality matters more than wind-wave height. Clean swell with moderate wind-wave height scores higher than the same
  total wave height dominated by local wind waves.
- Direction is recorded as the direction waves come from. Until Locations model coastline or break orientation, direction
  should only be used as a weak differentiator or explanation input, not as a hard suitability gate.
- Weather comfort adjusts score after surf quality. Mild temperature, low precipitation, low snow, and sunshine can improve
  otherwise similar surf days. Rain, snow, uncomfortable temperature, or low sunshine can reduce score.
- Wind and gusts are safety and quality controls. Strong land-weather wind or gusts lower score and can cap the day as
  unsuitable even when swell looks good.
- Severe weather codes, thunderstorms, freezing precipitation, heavy precipitation, meaningful snowfall, extreme wind, or
  extreme surf trigger hard caps near 0 because the day is known unsuitable.
- Ranking sorts scored days by descending Recommendation Score. If scores tie, earlier dates rank first.
- Recommendation Scores are not comparable across different activities.

## Examples

### Clean moderate swell

Conditions:

- Max wave height 1.5 m.
- Max wave period 11 s.
- Max swell wave height 1.3 m and max swell period 12 s.
- Max wind-wave height 0.3 m.
- Light land wind, low gusts, no precipitation, no snowfall, mild temperature, and partly cloudy weather.
- Surf is organized and moderate, with comfortable weather.

Score: 88

### Small but surfable day

Conditions:

- Max wave height 0.7 m.
- Max wave period 8 s.
- Max swell wave height 0.5 m and max swell period 9 s.
- Max wind-wave height 0.2 m.
- Dry weather, mild temperature, and low wind.
- Conditions are clean enough, but surf size and period are weak.

Score: 55

### Messy wind-wave day

Conditions:

- Max wave height 1.4 m.
- Max wave period 5 s.
- Max swell wave height 0.4 m and max swell period 7 s.
- Max wind-wave height 1.1 m.
- Noticeable wind and gusts, light rain, and little sunshine.
- Wave height exists, but most energy is short-period wind chop.

Score: 32

### Unusable storm surf

Conditions:

- Max wave height 4.5 m.
- Max wave period 14 s.
- Max swell wave height 4.0 m and max swell period 15 s.
- Max wind-wave height 1.0 m.
- Thunderstorm weather code, heavy precipitation, strong wind, and severe gusts.
- Surf and weather exceed the recreational suitability boundary.

Score: 5

### Surf data unavailable

Conditions:

- Forecast Day exists for the date.
- Surf Conditions Day is missing for the same date.
- Surf suitability is unknown, not known bad.

Score: Recommendation Score Unavailable
