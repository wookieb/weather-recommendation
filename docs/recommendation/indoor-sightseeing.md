# Indoor Sightseeing Scoring

## Overview

Indoor Sightseeing Scoring scores how suitable each returned Forecast Day is for visiting indoor attractions at one
Location. The Recommendation Score is an integer from 0 to 100 for indoor sightseeing only: 100 means best suitability,
and 0 means unusable conditions.

Indoor Sightseeing is a bad-weather refuge activity. Rain, cold, heat, low sunshine, moderate wind, or light snow can make
indoor attractions more suitable than outdoor plans. Severe travel-disrupting weather can still cap or lower the score.

This document describes scoring data, not a ranked Activity Recommendation. A scored day returns only its local date and
score. GraphQL recommendation composition can decide later how to present, order, rank, or explain the scored days.

## Assumptions/Exclusions

- Scoring assumes one supported Location and its Location-local Forecast Days.
- Scoring assumes normalized daily Forecast fields are available for each scored day.
- Scoring excludes attraction quality, attraction opening hours, crowds, cost, indoor capacity, accessibility needs,
  itinerary length, transport options, and user preferences.
- Scoring excludes hourly timing inside the Forecast Day.
- Scoring excludes cross-activity comparison; an Indoor Sightseeing score should not be compared with skiing, surfing, or
  outdoor sightseeing scores.
- Scoring excludes ranking behavior; returned days have no rank, no reason, and no order contract.

## Rules

- Scoring uses normalized Forecast fields only, not raw Open-Meteo response shapes.
- The scoring map contains only Forecast Days present in the Forecast. It does not invent missing dates when Forecast
  Lookup returns fewer than 7 days.
- Required inputs are weather code, minimum and maximum temperature in Celsius, precipitation sum in millimeters,
  precipitation probability percentage, max wind speed in km/h, and max wind gust in km/h.
- Optional inputs are snowfall sum in centimeters and sunshine duration in hours. Missing optional inputs are neutral.
- Missing required inputs produce Recommendation Score Unavailable for that Forecast Day, not a score of 0.
- A Recommendation Total Score sums returned day scores. A Forecast Day with Recommendation Score Unavailable contributes
  0 to the total.
- Base score starts at 50. Weather adjustments are added, score is clamped to 0-100, then the lowest applicable hard cap is
  applied.
- Precipitation increases indoor suitability until its benefit cap: dry conditions with precipitation `< 1 mm` and
  probability `< 30%` add `0`; damp or possible rain with precipitation `1-5 mm` or probability `30-60%` adds `10`; wet
  conditions with precipitation `> 5-20 mm` or probability `> 60-85%` add `20`; very wet conditions with precipitation
  `> 20 mm` or probability `> 85%` add `25`; precipitation `> 40 mm` hard-caps the final score at `55`.
- Temperature rewards outdoor discomfort: pleasant outdoor temperatures with minimum `>= 8 C` and maximum `18-26 C` add
  `-10`; cool or hot discomfort with maximum `10-17 C` or `27-30 C`, or minimum `0-7 C`, adds `10`; cold or very hot
  conditions with maximum `< 10 C` or `> 30 C`, or minimum `< 0 C`, add `20`; maximum `> 38 C` or minimum `< -15 C`
  hard-caps the final score at `60`.
- Wind increases indoor appeal until travel becomes poor: calm or moderate wind with wind `< 20 km/h` and gust
  `< 30 km/h` adds `0`; breezy wind `20-34 km/h` or gust `30-49 km/h` adds `10`; strong wind `35-49 km/h` or gust
  `50-69 km/h` adds `15`; severe wind `>= 50 km/h` or gust `>= 70 km/h` adds `-10` and hard-caps the final score at `45`.
- Weather code provides broad condition categories: clear or mainly clear codes `0-1` add `-5`; partly cloudy, overcast,
  or fog codes `2`, `3`, `45`, and `48` add `5`; severe codes `57`, `65`, `67`, `75`, `82`, `86`, `95`, `96`, and `99`
  hard-cap the final score at `50`; other rain or snow codes rely on numeric precipitation and snow rules.
- Sunshine, when present, rewards cloudy days: `< 2 h` adds `10`; `2-5 h` adds `5`; `5-8 h` adds `0`; `> 8 h` adds `-10`.
- Snowfall, when present, helps until movement is disrupted: `0 cm` adds `0`; `> 0-2 cm` adds `5`; `> 2-10 cm` adds
  `10`; `> 10-20 cm` adds `5` and hard-caps the final score at `65`; `> 20 cm` adds `-10` and hard-caps the final score
  at `45`.
- Returned scored days have no ranking behavior. Ordering carries no meaning, and tie-breaking is not defined.
- Recommendation Scores are not comparable across different activities.

## Examples

### Rainy museum day

Conditions:

- Precipitation 12 mm and precipitation probability 80%.
- Max temperature 15 C and min temperature 7 C.
- Max wind 18 km/h and max gust 25 km/h.
- Weather code is moderate rain.
- Sunshine 1 hour.
- Snowfall 0 cm.

Score: 90

### Pleasant sunny outdoor day

Conditions:

- Precipitation 0 mm and precipitation probability 10%.
- Max temperature 23 C and min temperature 12 C.
- Max wind 10 km/h and max gust 18 km/h.
- Weather code is clear sky.
- Sunshine 10 hours.
- Snowfall 0 cm.

Score: 25

### Severe windy storm day

Conditions:

- Precipitation 8 mm and precipitation probability 90%.
- Max temperature 21 C and min temperature 13 C.
- Max wind 55 km/h and max gust 75 km/h.
- Weather code is thunderstorm.
- Sunshine 1 hour.
- Snowfall 0 cm.
- Severe wind cap is lower than the severe weather-code cap.

Score: 45

### Required weather data missing

Conditions:

- Forecast Day exists for the local date.
- Weather code is missing.
- Precipitation, temperature, wind, and gust fields are present.
- Indoor sightseeing suitability is unknown, not known bad.

Score: Recommendation Score Unavailable
