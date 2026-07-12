# Weather Recommendation

Domain language for a backend that ranks upcoming weather for activities at supported places.

## Language

**Location**:
A city or town intentionally supported by this service for weather lookup and activity recommendation. It represents a curated catalog entry identified by a stable slug and described by a name, country, and geocoordinate.
_Avoid_: Supported Location, place

**Location Slug**:
A stable, human-readable identifier stored on a Location and shaped from its name and country code. It uses lowercase ASCII kebab-case and ends with the lowercase country code, so display names and coordinates can change without changing the Location's identity.
_Avoid_: generated id, coordinate id

**Country**:
The country associated with a Location, represented by both ISO 3166-1 alpha-2 uppercase country code and country name. A country may be referenced by either exact code or exact name when looking up a Location; informal aliases are not part of the domain language.
_Avoid_: country string

**Geocoordinate**:
The latitude and longitude pair used to locate a Location for weather lookup.
_Avoid_: coordinate id

**Location Catalog**:
The fixed set of Locations this service supports for weather lookup and activity recommendation. It is curated by the service, not discovered from Open-Meteo at request time, and cannot contain duplicate Locations with the same normalized name and country.
_Avoid_: GraphQL catalog, Open-Meteo search results

**Location Lookup**:
Finding a Location by name and country. Lookup ignores text casing, accents, and outer whitespace; blank lookup terms are invalid rather than “not found”.
_Avoid_: exact string match

**Location Not Found**:
The outcome of a Location Lookup when no Location exists in the Location Catalog for the requested name and country.
_Avoid_: unsupported city/town, invalid location

**Forecast**:
A weather prediction for one Location over a requested date range, represented as daily weather values used for activity recommendation. It may contain fewer Forecast Days than requested when the weather source supplies a shorter range, and it does not describe wave, swell, or surf conditions.
_Avoid_: Open-Meteo response, weather lookup, marine forecast

**Forecast Day**:
One local calendar date within a Forecast, interpreted in the Location's timezone rather than UTC or server time.
_Avoid_: UTC day, server day

**Forecast Lookup**:
Obtaining a Forecast for a Location. Forecast Lookup starts after Location Lookup and receives a Location rather than raw name and country text.
_Avoid_: city weather lookup, location search

**Forecast Unavailable**:
The outcome when a Forecast cannot be produced for a known Location because weather data is unavailable or unusable.
_Avoid_: Location Not Found, empty forecast

**Surf Conditions**:
Wave, swell, and near-coast wind signals for one Location over local calendar days, used to judge surfing suitability. Surf Conditions are separate from Forecast because Forecast describes land weather only.
_Avoid_: Marine Forecast, surf forecast, Open-Meteo marine response

**Surf Conditions Day**:
One local calendar date within Surf Conditions, interpreted in the Location's timezone and aligned with Forecast Day for daily activity ranking.
_Avoid_: provider day, UTC surf day, hourly surf window

**Surf Conditions Lookup**:
Obtaining Surf Conditions for a Location. Surf Conditions Lookup starts after Location Lookup and receives a Location rather than raw name and country text.
_Avoid_: marine location search, Open-Meteo marine lookup

**Surf Conditions Unavailable**:
The outcome when Surf Conditions cannot be produced for a known Location.
_Avoid_: Forecast Unavailable, Location Not Found, empty surf conditions

**Recommendation Score Unavailable**:
The outcome when a Recommendation Score cannot be produced because required activity signals are unknown or unusable.
_Avoid_: zero score, bad recommendation

**Surfing Recommendation**:
A ranked assessment of upcoming days for a recreational intermediate surfer at one supported Location, where marine conditions define core suitability and weather conditions may affect comfort or safety. It is not a ranking of beach weather alone.
_Avoid_: surfing weather proxy, beach weather ranking

**Surf Window**:
The best surfable period within one Location-local Forecast Day. A Surfing Recommendation for a day represents this window rather than an average across the whole day.
_Avoid_: daily average, midday sample

**Surfing Unavailable**:
The outcome when a Surfing Recommendation cannot be produced for a known Location because credible marine or surf data is unavailable. It is different from a day with poor surfing conditions.
_Avoid_: Location Not Found, seven bad surf days

**Activity Recommendation**:
A ranked assessment of Forecast Days for one activity at one Location. It ranks the Forecast Days present in the Forecast and does not invent missing Forecast Days.
_Avoid_: itinerary, trip plan, weather lookup

**Outdoor Sightseeing**:
A weather-scored activity for walking-heavy city or town visits on a Forecast Day. It considers comfort, dryness, wind safety, snow absence, and daylight or sunshine, but excludes attractions, crowds, cost, transport, and user preferences.
_Avoid_: tourism, city break, attractions ranking

**Outdoor Sightseeing Unusable**:
An Outdoor Sightseeing outcome for a Forecast Day whose weather makes walking-heavy sightseeing unsuitable even if some weather signals are pleasant.
_Avoid_: bad rank, low comfort day

**Recommendation Score**:
An integer from 0 to 100 that expresses absolute suitability for one activity on one Forecast Day, where 100 is best and 0 is unusable. It is not relative to the other returned Forecast Days and is not comparable across different activities.
_Avoid_: rating, relative score, percentage chance, global weather score

**Recommendation Rank**:
The ordering position of a Forecast Day within an activity recommendation result, sorted by descending Recommendation Score with earlier Forecast Days first when scores tie.
_Avoid_: index, sort order

**Recommendation Reason**:
A short explanation of the main weather factors that influenced a Recommendation Score.
_Avoid_: debug trace, scoring breakdown

**Recommendation Unavailable**:
The outcome when an Activity Recommendation cannot be produced for a known Location because the needed Forecast or activity-specific source data is unavailable or unusable.
_Avoid_: empty recommendation, Location Not Found

**Indoor Sightseeing**:
An activity recommendation for visiting indoor attractions, where unpleasant outdoor weather can make the activity more suitable but severe travel-disrupting weather makes it less suitable.
_Avoid_: weather-resilient sightseeing, mild-weather sightseeing

**Recommendation Total Score**:
The sum of Recommendation Scores across the returned Forecast Days for one activity and Location. A Forecast Day with no Recommendation Score contributes 0 to this total.
_Avoid_: average score, overall rank
