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

**Forecast**:
Normalized weather for one known Location, grouped into Forecast Days and shaped for activity scoring. It is weather-only and excludes marine wave, swell, and surf conditions.
_Avoid_: Open-Meteo response, weather blob

**Forecast Day**:
A Location-local calendar date within a Forecast. It carries normalized daily weather measurements such as temperature, precipitation, wind, snowfall, and sunshine duration.
_Avoid_: provider row, UTC day

**Forecast Lookup**:
Requesting a Forecast for a known Location by using its geocoordinate with the weather provider and caching successful results by Location Slug.
_Avoid_: location lookup, raw weather fetch

**Forecast Unavailable**:
The result when a known Location cannot produce usable provider weather data. It is distinct from Location Not Found and is not cached.
_Avoid_: location missing, empty forecast

**Location Not Found**:
The outcome of a Location Lookup when no Location exists in the Location Catalog for the requested name and country.
_Avoid_: unsupported city/town, invalid location

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
A scored assessment of upcoming days for a recreational intermediate surfer at one supported Location, where Surf Conditions define core suitability and weather conditions may affect comfort or safety. It is not a ranking of beach weather alone.
_Avoid_: surfing weather proxy, beach weather ranking

**Surfing Day Score**:
A Recommendation Score for surfing on one Forecast Day. It is scoring data rather than a ranked Activity Recommendation.
_Avoid_: surf rank, surf reason, surf recommendation row

**Surfing Unavailable**:
The outcome when a Surfing Recommendation cannot be produced for a known Location because Forecast or Surf Conditions are unavailable as a whole. It is different from a day with poor surfing conditions or a produced recommendation with no scored days.
_Avoid_: Location Not Found, seven bad surf days, empty ranked result

**Skiing Recommendation**:
A scored assessment of upcoming days for recreational piste or resort skiing at one supported Location, using Forecast weather signals only. It excludes resort open status, lift status, grooming, avalanche risk, snow base depth, off-piste quality, travel access, skill level, and user preferences.
_Avoid_: resort operations ranking, backcountry skiing ranking, snow day ranking

**Skiing Day Score**:
A Recommendation Score for skiing on one Forecast Day, based on snow, temperature, wind, precipitation, and weather condition signals. If those core signals are missing, the score is unavailable; sunshine is a comfort signal rather than a core signal.
_Avoid_: ski rank, resort score, snow score

**Skiing Unavailable**:
The outcome when a Skiing Recommendation cannot be produced for a known Location because no usable Forecast Day can produce a Skiing Day Score. It is different from a set of days with poor skiing conditions.
_Avoid_: Location Not Found, seven bad ski days, zero score

**Activity Recommendation**:
A ranked assessment of Forecast Days for one activity at one Location. It ranks the Forecast Days present in the Forecast and does not invent missing Forecast Days.
_Avoid_: itinerary, trip plan, weather lookup

**Combined Activity Recommendation**:
A collection of Activity Recommendations for multiple activities at one Location, produced by composing the activity-specific scoring contracts rather than adding new activity scoring rules.
_Avoid_: activity scorer, final query, itinerary

**Aggregated Score**:
The scoring-layer result that carries one Recommendation Average Score per activity plus per-day Recommendation Scores by Forecast Day and activity. It preserves score unavailability instead of converting it to zero.
_Avoid_: GraphQL response, ranked recommendation

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

**Unranked Recommendation Day**:
A Forecast Day present in an Activity Recommendation whose Recommendation Score is unavailable. It remains part of the recommendation result but has no Recommendation Rank.
_Avoid_: omitted day, zero-score day

**Recommendation Reason**:
A short explanation of the main weather factors that influenced a Recommendation Score.
_Avoid_: debug trace, scoring breakdown

**Recommendation Unavailable**:
The outcome when an Activity Recommendation cannot be produced for a known Location because the needed Forecast or activity-specific source data is unavailable or unusable.
_Avoid_: empty recommendation, Location Not Found

**Indoor Sightseeing**:
An activity recommendation for visiting indoor attractions, where unpleasant outdoor weather can make the activity more suitable but severe travel-disrupting weather makes it less suitable.
_Avoid_: weather-resilient sightseeing, mild-weather sightseeing

**Recommendation Average Score**:
The rounded arithmetic mean of produced Recommendation Scores across returned Forecast Days for one activity and Location. A Forecast Day with Recommendation Score Unavailable is excluded from the mean; if no Forecast Day has a produced Recommendation Score, the average score is unavailable. Half values round up to the nearest integer.
_Avoid_: total score, sum score, overall rank
