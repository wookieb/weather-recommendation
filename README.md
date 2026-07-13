# Weather Recommendation

Backend service that ranks upcoming weather for activities at supported Locations.

## Running Locally

Install dependencies:

```sh
yarn install
```

Start the development server:

```sh
yarn start:dev
```

The GraphQL endpoint runs at `http://localhost:3000/`.

## Example GraphQL Request

```graphql
query {
  combinedRecommendation(country: "NO", name: "Oslo") {
    location {
      country {
        name
        code
      }
      geocoordinate {
        latitude
        longitude
      }
    }
    days {
      date
      indoorSightseeing
      outdoorSightseeing
      skiing
      surfing
    }
    average {
      indoorSightseeing
      outdoorSightseeing
      skiing
      surfing
    }
  }
}
```

## Recommendation Docs

- [Indoor Sightseeing Scoring](docs/recommendation/indoor-sightseeing.md)
- [Outdoor Sightseeing](docs/recommendation/outdoor-sightseeing.md)
- [Recommendation Aggregation](docs/recommendation/aggregation.md)
- [Skiing Day Scoring](docs/recommendation/skiing.md)
- [Surfing Day Scoring](docs/recommendation/surfing.md)
