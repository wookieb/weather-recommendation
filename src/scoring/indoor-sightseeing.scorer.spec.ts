import { just, none } from '@sweet-monads/maybe';
import sinon from 'sinon';
import { describe, expect, it } from 'vitest';
import { ForecastHelper } from '../forecast/forecast.helper';
import { type Forecast, type ForecastDay } from '../forecast/forecast.types';
import { type Location } from '../location/location.types';
import { IndoorSightseeingScorer } from './indoor-sightseeing.scorer';

const london: Location = {
  slug: 'london-gb',
  name: 'London',
  country: { code: 'GB', name: 'United Kingdom' },
  geocoordinate: { latitude: 51.50853, longitude: -0.12574 },
};

describe('IndoorSightseeingScorer.score', () => {
  it('scores Indoor Sightseeing for Forecast Days present in the Forecast', async () => {
    const scorer = scorerWithForecastDay({
      weatherCode: 3,
      maxTemperatureCelsius: 16,
      minTemperatureCelsius: 6,
      precipitationSumMillimeters: 6,
      precipitationProbabilityPercent: 70,
      maxWindSpeedKmh: 22,
      maxWindGustKmh: 35,
      snowfallCentimeters: 1,
      sunshineDurationHours: 1,
    });

    const result = await scorer.score(london);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 100]]);
  });

  it('returns no score for a Forecast Day missing a required scoring field', async () => {
    const scorer = scorerWithForecastDay({
      weatherCode: 3,
      maxTemperatureCelsius: 16,
      minTemperatureCelsius: 6,
      precipitationSumMillimeters: 6,
      precipitationProbabilityPercent: 70,
      maxWindSpeedKmh: 22,
      maxWindGustKmh: null,
      snowfallCentimeters: 1,
      sunshineDurationHours: 1,
    });

    const result = await scorer.score(london);

    expect(maybeScoreEntries(result)).toEqual([['2026-07-12', null]]);
  });

  it('applies the lowest severe-condition cap after clamping', async () => {
    const scorer = scorerWithForecastDay({
      weatherCode: 95,
      maxTemperatureCelsius: 39,
      minTemperatureCelsius: 6,
      precipitationSumMillimeters: 50,
      precipitationProbabilityPercent: 95,
      maxWindSpeedKmh: 55,
      maxWindGustKmh: 75,
      snowfallCentimeters: 25,
      sunshineDurationHours: 1,
    });

    const result = await scorer.score(london);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 45]]);
  });

  it('treats missing optional scoring fields as neutral', async () => {
    const scorer = scorerWithForecastDay({
      weatherCode: 0,
      maxTemperatureCelsius: 22,
      minTemperatureCelsius: 12,
      precipitationSumMillimeters: 0,
      precipitationProbabilityPercent: 10,
      maxWindSpeedKmh: 10,
      maxWindGustKmh: 20,
      snowfallCentimeters: null,
      sunshineDurationHours: null,
    });

    const result = await scorer.score(london);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 35]]);
  });

  it('returns no Forecast Days when Forecast Lookup is unavailable', async () => {
    const scorer = new IndoorSightseeingScorer(
      forecastHelperWithForecast(none<Forecast>()),
    );

    const result = await scorer.score(london);

    expect(scoreEntries(result)).toEqual([]);
  });
});

function scoreEntries(
  result: Awaited<ReturnType<IndoorSightseeingScorer['score']>>,
) {
  return result
    .toArray()
    .map(([date, score]) => [date.toString(), score.value]);
}

function maybeScoreEntries(
  result: Awaited<ReturnType<IndoorSightseeingScorer['score']>>,
) {
  return result
    .toArray()
    .map(([date, score]) => [
      date.toString(),
      score.isJust() ? score.value : null,
    ]);
}

function scorerWithForecastDay(day: ForecastDay): IndoorSightseeingScorer {
  return new IndoorSightseeingScorer(
    forecastHelperWithForecast(just(forecastWithDay(day))),
  );
}

function forecastHelperWithForecast(
  forecast: Awaited<ReturnType<ForecastHelper['get']>>,
): ForecastHelper {
  const forecastHelper = sinon.createStubInstance(ForecastHelper);
  forecastHelper.get.resolves(forecast);

  return forecastHelper;
}

function forecastWithDay(day: ForecastDay): Forecast {
  return new Map([[plainDate('2026-07-12'), day]]);
}

function plainDate(value: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(value);
}
