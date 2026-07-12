# Outdoor Sightseeing Recommendation

## Overview

Outdoor Sightseeing scores how suitable each available Forecast Day is for walking-heavy city or town visits at one
Location. The Recommendation Score is an absolute integer from 0 to 100 for this activity only: 100 means best
sightseeing weather, and 0 means unusable weather.

The recommendation ranks every Forecast Day returned by the cached 7-day Forecast Lookup. If the Forecast contains fewer
than 7 Forecast Days, the recommendation ranks only those available days and does not invent missing days. If Forecast
Lookup is unavailable, the result is Recommendation Unavailable rather than an empty list.

## Assumptions/Exclusions

- Outdoor Sightseeing assumes walking-heavy city or town visits on a Forecast Day.
- Scoring assumes weather suitability can be judged from normalized daily Forecast fields.
- Scoring excludes attractions, crowds, cost, transport, opening hours, itinerary length, accessibility needs, and user
  preferences.
- Scoring excludes live conditions and hourly timing inside the day.
- Scoring excludes cross-activity comparison; an Outdoor Sightseeing score should not be compared with skiing, surfing,
  or indoor sightseeing scores.

## Rules

- Scoring uses normalized Forecast fields only, not raw Open-Meteo response shapes. Relevant fields are local date,
  weather code, minimum and maximum temperature in Celsius, precipitation sum in millimeters, precipitation probability
  percentage, max wind speed in km/h, max wind gust in km/h, snowfall in centimeters, and sunshine duration in hours.
- Temperature comfort is a primary scoring factor. Best days have maximum temperature from 18 C to 26 C and minimum
  temperature not below 8 C. Cool days from 10 C to 17 C and warm days from 27 C to 30 C are borderline. Days colder
  than 10 C or hotter than 30 C score poorly, with extreme cold or heat treated as unusable.
- Dryness is a primary scoring factor. Dry days with low precipitation probability score best. Light rain is tolerated
  when precipitation is up to about 2 mm/day and precipitation probability is no higher than 50%, provided temperature
  and wind remain comfortable. Steady rain, heavy rain, or high precipitation probability strongly lowers the score and
  can make the day unusable.
- Wind affects comfort and safety. Mild wind is acceptable. Noticeable wind lowers the score. Strong max wind speed or
  strong max gust can make a Forecast Day unusable, because walking-heavy sightseeing becomes unsafe or unpleasant.
- Snow makes Outdoor Sightseeing less suitable. Snowfall lowers the score, and meaningful snow can make the day unusable
  even if other weather signals look pleasant.
- Weather code classifies conditions for severe-weather caps. Thunderstorms, freezing precipitation, or other severe
  codes can cap the score as unusable. Clear or partly cloudy codes do not override poor rain, wind, snow, or
  temperature signals.
- Sunshine duration is a positive tie-breaker. Sunshine helps distinguish otherwise similar days, but a dry, mild,
  cloudy day should usually outrank a sunny day with rain, strong wind, snow, or uncomfortable temperature.
- Ranking sorts Forecast Days by descending Recommendation Score. If scores tie, earlier Forecast Days rank first.
  Recommendation Scores are not comparable across different activities.

## Examples

### Good sightseeing day

Conditions:

- Max temperature 22 C and min temperature 12 C.
- Precipitation 0 mm and precipitation probability 10%.
- Max wind 12 km/h and max gust 22 km/h.
- Snowfall 0 cm.
- Sunshine 8 hours with clear or partly cloudy weather code.
- Mild, dry, calm, snow-free, and sunny conditions.

Score: 90

### Borderline light-rain day

Conditions:

- Max temperature 19 C and min temperature 10 C.
- Precipitation 1.5 mm and precipitation probability 45%.
- Max wind 16 km/h and max gust 28 km/h.
- Snowfall 0 cm.
- Sunshine 3 hours with light rain weather code.
- Rain stays within the tolerated light-rain boundary.

Score: 68

### Poor hot day

Conditions:

- Max temperature 33 C and min temperature 23 C.
- Precipitation 0 mm and precipitation probability 5%.
- Max wind 10 km/h and max gust 18 km/h.
- Snowfall 0 cm.
- Sunshine 10 hours with clear weather code.
- Dry and sunny weather helps, but heat makes walking-heavy sightseeing uncomfortable.

Score: 35

### Unusable storm day

Conditions:

- Max temperature 21 C and min temperature 14 C.
- Precipitation 12 mm and precipitation probability 90%.
- Max wind 35 km/h and max gust 65 km/h.
- Snowfall 0 cm.
- Sunshine 1 hour with thunderstorm weather code.
- Heavy rain, high rain probability, thunderstorm conditions, and strong gusts trigger hard caps.

Score: 10
