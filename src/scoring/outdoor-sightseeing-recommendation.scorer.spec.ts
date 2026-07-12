import { CacheableMemory } from 'cacheable';
import sinon from 'sinon';
import { describe, expect, it } from 'vitest';
import {
  FORECAST_CACHE_TTL,
  ForecastHelper,
} from '../forecast/forecast.helper';
import { OpenMeteoForecastFixture } from '../forecast/open-meteo-forecast.fixture';
import { OpenMeteoClient } from '../forecast/open-meteo.client';
import { type Location } from '../location/location.types';
import { OutdoorSightseeingRecommendationScorer } from './outdoor-sightseeing-recommendation.scorer';

const london: Location = {
  slug: 'london-gb',
  name: 'London',
  country: { code: 'GB', name: 'United Kingdom' },
  geocoordinate: { latitude: 51.50853, longitude: -0.12574 },
};

describe('OutdoorSightseeingRecommendationScorer.score', () => {
  it('scores good, borderline, and bad Outdoor Sightseeing Forecast Days', async () => {
    const scorer = scorerFromForecastResponse({
      daily: {
        time: ['2026-07-12', '2026-07-13', '2026-07-14'],
        weather_code: [1, 3, 95],
        temperature_2m_max: [23, 29, 22],
        temperature_2m_min: [13, 11, 12],
        precipitation_sum: [0.5, 2, 25],
        precipitation_probability_max: [20, 50, 90],
        wind_speed_10m_max: [12, 24, 55],
        wind_gusts_10m_max: [20, 36, 76],
        snowfall_sum: [0, 0, 0],
        sunshine_duration: [28800, 14400, 3600],
      },
    });

    const result = await scorer.score(london);

    expect(scoreEntries(result)).toEqual([
      ['2026-07-12', 98],
      ['2026-07-13', 71],
      ['2026-07-14', 20],
    ]);
  });

  it('does not synthesize missing Forecast Days for a partial Forecast', async () => {
    const scorer = scorerFromForecastResponse({
      daily: {
        time: ['2026-07-12', '2026-07-14'],
        weather_code: [1, 2],
        temperature_2m_max: [23, 23],
        temperature_2m_min: [13, 13],
        precipitation_sum: [0, 0],
        precipitation_probability_max: [10, 10],
        wind_speed_10m_max: [12, 12],
        wind_gusts_10m_max: [20, 20],
        snowfall_sum: [0, 0],
        sunshine_duration: [28800, 28800],
      },
    });

    const result = await scorer.score(london);

    expect(scoreEntries(result).map(([date]) => date)).toEqual([
      '2026-07-12',
      '2026-07-14',
    ]);
  });

  it('returns no score for a Forecast Day missing a required scoring field', async () => {
    const scorer = scorerFromForecastResponse({
      daily: {
        time: ['2026-07-12'],
        weather_code: [1],
        temperature_2m_max: [23],
        temperature_2m_min: [13],
        precipitation_sum: [0],
        precipitation_probability_max: [10],
        wind_speed_10m_max: [12],
        wind_gusts_10m_max: [null],
        snowfall_sum: [0],
        sunshine_duration: [28800],
      },
    });

    const result = await scorer.score(london);

    expect(maybeScoreEntries(result)).toEqual([['2026-07-12', null]]);
  });

  it('penalizes a hot dry Forecast Day below borderline comfort', async () => {
    const scorer = scorerFromForecastResponse({
      daily: {
        time: ['2026-07-12'],
        weather_code: [1],
        temperature_2m_max: [33],
        temperature_2m_min: [23],
        precipitation_sum: [0],
        precipitation_probability_max: [5],
        wind_speed_10m_max: [10],
        wind_gusts_10m_max: [18],
        snowfall_sum: [0],
        sunshine_duration: [36000],
      },
    });

    const result = await scorer.score(london);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 35]]);
  });

  it('penalizes a cold dry Forecast Day below borderline comfort', async () => {
    const scorer = scorerFromForecastResponse({
      daily: {
        time: ['2026-07-12'],
        weather_code: [1],
        temperature_2m_max: [8],
        temperature_2m_min: [2],
        precipitation_sum: [0],
        precipitation_probability_max: [5],
        wind_speed_10m_max: [10],
        wind_gusts_10m_max: [18],
        snowfall_sum: [0],
        sunshine_duration: [36000],
      },
    });

    const result = await scorer.score(london);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 55]]);
  });

  it('caps an extreme hot Forecast Day as unusable', async () => {
    const scorer = scorerFromForecastResponse({
      daily: {
        time: ['2026-07-12'],
        weather_code: [1],
        temperature_2m_max: [40],
        temperature_2m_min: [24],
        precipitation_sum: [0],
        precipitation_probability_max: [5],
        wind_speed_10m_max: [10],
        wind_gusts_10m_max: [18],
        snowfall_sum: [0],
        sunshine_duration: [36000],
      },
    });

    const result = await scorer.score(london);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 0]]);
  });

  it('returns no Forecast Days when Forecast Lookup is unavailable', async () => {
    const scorer = scorerFromProviderBody({ daily: { time: '2026-07-12' } });

    const result = await scorer.score(london);

    expect(scoreEntries(result)).toEqual([]);
  });
});

function scorerFromForecastResponse(
  response: Parameters<typeof OpenMeteoForecastFixture.build>[0],
): OutdoorSightseeingRecommendationScorer {
  return scorerFromProviderBody(OpenMeteoForecastFixture.build(response));
}

function maybeScoreEntries(
  result: Awaited<ReturnType<OutdoorSightseeingRecommendationScorer['score']>>,
): Array<[string, number | null]> {
  return result
    .toArray()
    .map(([date, score]) => [
      date.toString(),
      score.isJust() ? score.value : null,
    ]);
}

function scorerFromProviderBody(
  body: unknown,
): OutdoorSightseeingRecommendationScorer {
  return new OutdoorSightseeingRecommendationScorer(
    new ForecastHelper(
      clientFromBody(body),
      new CacheableMemory({ ttl: FORECAST_CACHE_TTL, useClone: false }),
    ),
  );
}

function clientFromBody(body: unknown): OpenMeteoClient {
  const openMeteoClient = sinon.createStubInstance(OpenMeteoClient);
  openMeteoClient.getForecast.resolves(body as never);
  return openMeteoClient;
}

function scoreEntries(
  result: Awaited<ReturnType<OutdoorSightseeingRecommendationScorer['score']>>,
): Array<[string, number]> {
  return result
    .toArray()
    .map(([date, score]) => [date.toString(), score.value] as [string, number])
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate));
}
