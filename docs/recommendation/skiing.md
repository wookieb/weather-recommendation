# Skiing Day Scoring

## Overview

Skiing Day Scoring scores how suitable each returned Forecast Day is for recreational piste or resort skiing at one
Location. The Recommendation Score is an integer from 0 to 100 for skiing only: 100 means best weather suitability, and 0
means unusable skiing weather.

This document describes scoring data, not a ranked Activity Recommendation. A scored day returns only its local date and
score. GraphQL recommendation composition can decide later how to present, order, rank, or explain the scored days.

## Assumptions/Exclusions

- Scoring assumes recreational piste or resort skiing at one supported Location.
- Scoring assumes normalized daily Forecast fields are available for each scored day.
- Scoring is weather-only. It does not prove skiing is available at or near the Location.
- Scoring excludes resort open status, lift status, grooming, avalanche risk, snow base depth, off-piste quality, travel
  access, ski-area proximity, skill level, user preferences, cost, crowds, and equipment choice.
- Scoring excludes hourly timing inside the Forecast Day.
- Scoring excludes cross-activity comparison; a Skiing Day Score should not be compared with surfing, outdoor sightseeing,
  or indoor sightseeing scores.
- Scoring excludes ranking behavior; returned days have no rank, no reason, and no order contract.

## Rules

- Scoring uses normalized Forecast fields only, not raw Open-Meteo response shapes.
- The scoring map contains only Forecast Days present in the Forecast. It does not invent missing dates when Forecast
  Lookup returns fewer than 7 days.
- Required inputs are weather code, minimum and maximum temperature in Celsius, precipitation sum in millimeters,
  precipitation probability percentage, max wind speed in km/h, max wind gust in km/h, and snowfall in centimeters.
- Optional input is sunshine duration in hours. Missing sunshine is neutral.
- Missing required inputs produce Recommendation Score Unavailable for that Forecast Day, not a score of 0.
- If Forecast Lookup is unavailable, the scorer returns no Forecast Days.
- Base score starts at 50. Weather adjustments are added, score is clamped to 0-100, then the lowest applicable hard cap is
  applied.
- A score of 100 is achievable when moderate fresh snow, cold temperatures, low rain risk, manageable wind, favorable
  weather code, and useful daylight align without a hard cap.
- A score of 0 is achievable when warm no-snow weather combines with heavy rain risk, severe wind, storm conditions, and
  poor visibility or daylight.
- Good skiing days score 75-100, borderline days score 40-74, and bad days score 0-39.
- Snowfall rewards fresh skiable snow but caps excessive storm snow: `0 cm` adds `-25`; `> 0-3 cm` adds `5`; `> 3-20 cm`
  adds `25`; `> 20-40 cm` adds `10` and hard-caps the final score at `80`; `> 40 cm` adds `-10` and hard-caps the final
  score at `55`.
- Temperature rewards cold snow-preserving weather but penalizes warmth and extreme cold: maximum `-8 C` to `2 C` with
  minimum `-12 C` to `0 C` adds `15`; maximum `3-6 C` adds `-10`; maximum `> 6-8 C` adds `-15`; maximum `> 8 C` adds
  `-25` and hard-caps the final score at `35`; maximum `< -12 C` or minimum `< -18 C` adds `-15`; minimum `< -25 C`
  hard-caps the final score at `40`.
- Precipitation is interpreted through weather code and snowfall. A snowy day is a day with snow weather code or snowfall
  `>= 3 cm`.
- On snowy days, precipitation is not treated as rain. Snowy precipitation normally adds `0`; precipitation `> 20 mm` or
  probability `> 85%` adds `-5` for visibility and access risk.
- On non-snowy days, dry weather with precipitation `< 1 mm` and probability `< 30%` adds `0`; light or mixed
  precipitation with precipitation `1-5 mm` or probability `30-60%` adds `-10`; wet weather with precipitation `> 5-20 mm`
  or probability `> 60-85%` adds `-20`; heavy rain risk with precipitation `> 20 mm` or probability `> 85%` adds `-30` and
  hard-caps the final score at `35`.
- Wind rewards calm conditions and penalizes unsafe or uncomfortable wind: max wind `< 20 km/h` and gust `< 30 km/h` adds
  `5`; wind `20-34 km/h` or gust `30-49 km/h` adds `0`; wind `35-49 km/h` or gust `50-69 km/h` adds `-15`; wind
  `>= 50 km/h` or gust `>= 70 km/h` adds `-30` and hard-caps the final score at `35`.
- Weather code adjusts safety and visibility: snow codes `71`, `73`, `75`, `77`, `85`, and `86` add `5`; clear, mainly
  clear, partly cloudy, and overcast codes `0`, `1`, `2`, and `3` add `0`; fog codes `45` and `48` add `-10`; rain or
  drizzle codes `51`, `53`, `55`, `61`, `63`, `65`, `80`, `81`, and `82` add `-10`; freezing drizzle or freezing rain
  codes `56`, `57`, `66`, and `67` add `-20` and hard-cap the final score at `25`; very heavy snow codes `75` and `86`
  hard-cap the final score at `65`; thunderstorm codes `95`, `96`, and `99` add `-20` and hard-cap the final score at
  `20`.
- Sunshine affects visibility and comfort but is not required: missing sunshine adds `0`; `< 2 h` adds `-5`; `2-8 h` adds
  `5`; `> 8 h` adds `0`.
- Returned scored days have no ranking behavior. Ordering carries no meaning, and tie-breaking is not defined.
- Recommendation Scores are not comparable across different activities.

## Examples

### Ideal powder day

Conditions:

- Snowfall 10 cm with snow weather code.
- Max temperature -2 C and min temperature -8 C.
- Precipitation 4 mm and precipitation probability 50%, interpreted as snowy precipitation.
- Max wind 12 km/h and max gust 20 km/h.
- Sunshine 5 hours.
- Moderate fresh snow, cold temperatures, calm wind, snow weather code, and usable daylight all align.

Score: 100

### Borderline breezy spring snow

Conditions:

- Snowfall 2 cm with snow weather code.
- Max temperature 4 C and min temperature -1 C.
- Precipitation 2 mm and precipitation probability 45%, interpreted as snowy precipitation.
- Max wind 38 km/h and max gust 52 km/h.
- Sunshine 4 hours.
- Small snowfall helps, but above-freezing warmth and breezy wind make skiing borderline.

Score: 40

### Heavy storm snow day

Conditions:

- Snowfall 45 cm with very heavy snow weather code.
- Max temperature -3 C and min temperature -10 C.
- Precipitation 30 mm and precipitation probability 90%, interpreted as snowy precipitation with visibility and access
  risk.
- Max wind 22 km/h and max gust 35 km/h.
- Sunshine 1 hour.
- Fresh snow and cold help, but very heavy snow and low sunshine limit suitability.

Score: 50

### Unusable warm thunderstorm

Conditions:

- Snowfall 0 cm with thunderstorm weather code.
- Max temperature 12 C and min temperature 6 C.
- Precipitation 18 mm and precipitation probability 90%, interpreted as heavy rain risk.
- Max wind 55 km/h and max gust 75 km/h.
- Sunshine 1 hour.
- Warm no-snow weather, heavy rain risk, severe wind, and storm conditions make skiing unusable.

Score: 0

### Required snow data missing

Conditions:

- Forecast Day exists for the local date.
- Snowfall is missing.
- Weather code, precipitation, temperature, wind, and gust fields are present.
- Skiing suitability is unknown, not known bad.

Score: Recommendation Score Unavailable
