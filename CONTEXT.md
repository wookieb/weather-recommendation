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
