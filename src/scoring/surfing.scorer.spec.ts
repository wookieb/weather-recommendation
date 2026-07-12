import { just, none } from '@sweet-monads/maybe';
import sinon from 'sinon';
import { describe, expect, it } from 'vitest';
import { ForecastHelper } from '../forecast/forecast.helper';
import { type Forecast, type ForecastDay } from '../forecast/forecast.types';
import { type Location } from '../location/location.types';
import { SurfConditionsHelper } from '../surf-conditions/surf-conditions.helper';
import {
  type SurfConditions,
  type SurfConditionsDay,
} from '../surf-conditions/surf-conditions.types';
import { SurfingScorer } from './surfing.scorer';

const sydney: Location = {
  slug: 'sydney-au',
  name: 'Sydney',
  country: { code: 'AU', name: 'Australia' },
  geocoordinate: { latitude: -33.86785, longitude: 151.20732 },
};

describe('SurfingScorer.score', () => {
  it('scores ideal clean Surf Conditions at 100', async () => {
    const scorer = scorerWithDays(
      forecastDay(),
      surfConditionsDay({
        maxWaveHeightMeters: 1.4,
        maxWavePeriodSeconds: 12,
        dominantWaveDirectionDegrees: 120,
        maxSwellWaveHeightMeters: 1.2,
        maxSwellWavePeriodSeconds: 12,
        dominantSwellWaveDirectionDegrees: 120,
        maxWindWaveHeightMeters: 0.2,
      }),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 100]]);
  });

  it('scores borderline small Surf Conditions at 52', async () => {
    const scorer = scorerWithDays(
      forecastDay(),
      surfConditionsDay({
        maxWaveHeightMeters: 0.6,
        maxWavePeriodSeconds: 8,
        dominantWaveDirectionDegrees: 120,
        maxSwellWaveHeightMeters: 0.5,
        maxSwellWavePeriodSeconds: 8,
        dominantSwellWaveDirectionDegrees: 120,
        maxWindWaveHeightMeters: 0.1,
      }),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 52]]);
  });

  it('scores messy wind-chop Surf Conditions at 30', async () => {
    const scorer = scorerWithDays(
      forecastDay({
        precipitationSumMillimeters: 1.5,
        precipitationProbabilityPercent: 40,
        maxWindSpeedKmh: 28,
        maxWindGustKmh: 42,
        sunshineDurationHours: 1,
      }),
      surfConditionsDay({
        maxWaveHeightMeters: 1.2,
        maxWavePeriodSeconds: 5,
        dominantWaveDirectionDegrees: 120,
        maxSwellWaveHeightMeters: 0.8,
        maxSwellWavePeriodSeconds: 5,
        dominantSwellWaveDirectionDegrees: 120,
        maxWindWaveHeightMeters: 0.7,
      }),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 30]]);
  });

  it('scores near-flat Surf Conditions poorly', async () => {
    const scorer = scorerWithDays(
      forecastDay(),
      surfConditionsDay({
        maxWaveHeightMeters: 0.2,
        maxWavePeriodSeconds: 12,
        dominantWaveDirectionDegrees: 120,
        maxSwellWaveHeightMeters: 0.2,
        maxSwellWavePeriodSeconds: 12,
        dominantSwellWaveDirectionDegrees: 120,
        maxWindWaveHeightMeters: 0.1,
      }),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 15]]);
  });

  it('vetoes extreme Surf Conditions as unusable', async () => {
    const scorer = scorerWithDays(
      forecastDay(),
      surfConditionsDay({
        maxWaveHeightMeters: 5,
        maxWavePeriodSeconds: 12,
        dominantWaveDirectionDegrees: 120,
        maxSwellWaveHeightMeters: 4.5,
        maxSwellWavePeriodSeconds: 12,
        dominantSwellWaveDirectionDegrees: 120,
        maxWindWaveHeightMeters: 0.4,
      }),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 0]]);
  });

  it('vetoes storm Surf Conditions as unusable', async () => {
    const scorer = scorerWithDays(
      forecastDay({
        weatherCode: 95,
        precipitationSumMillimeters: 30,
        precipitationProbabilityPercent: 90,
        maxWindSpeedKmh: 55,
        maxWindGustKmh: 75,
      }),
      surfConditionsDay({
        maxWaveHeightMeters: 2,
        maxWavePeriodSeconds: 12,
        dominantWaveDirectionDegrees: 120,
        maxSwellWaveHeightMeters: 1.8,
        maxSwellWavePeriodSeconds: 12,
        dominantSwellWaveDirectionDegrees: 120,
        maxWindWaveHeightMeters: 0.4,
      }),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 0]]);
  });

  it('vetoes freezing rain as unusable', async () => {
    const scorer = scorerWithDays(
      forecastDay({
        weatherCode: 67,
        precipitationSumMillimeters: 5,
        precipitationProbabilityPercent: 60,
      }),
      surfConditionsDay(),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 0]]);
  });

  it('vetoes meaningful snowfall as unusable', async () => {
    const scorer = scorerWithDays(
      forecastDay({
        weatherCode: 73,
        snowfallCentimeters: 8,
      }),
      surfConditionsDay(),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 0]]);
  });

  it('reduces clean Surf Conditions for uncomfortable heat', async () => {
    const scorer = scorerWithDays(
      forecastDay({ maxTemperatureCelsius: 33, minTemperatureCelsius: 24 }),
      surfConditionsDay(),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 85]]);
  });

  it('reduces clean Surf Conditions for likely rain', async () => {
    const scorer = scorerWithDays(
      forecastDay({ precipitationProbabilityPercent: 90 }),
      surfConditionsDay(),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 80]]);
  });

  it('reduces clean Surf Conditions for low sunshine', async () => {
    const scorer = scorerWithDays(
      forecastDay({ sunshineDurationHours: 0 }),
      surfConditionsDay(),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 90]]);
  });

  it('omits Forecast Days missing required Surf Conditions fields', async () => {
    const scorer = scorerWithForecastAndSurfConditions(
      new Map([
        [plainDate('2026-07-12'), forecastDay()],
        [plainDate('2026-07-13'), forecastDay()],
      ]),
      new Map([
        [
          plainDate('2026-07-12'),
          surfConditionsDay({ maxWavePeriodSeconds: null }),
        ],
        [plainDate('2026-07-13'), surfConditionsDay()],
      ]),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-13', 100]]);
  });

  it('scores Forecast Days missing unused Surf Conditions fields', async () => {
    const scorer = scorerWithDays(
      forecastDay(),
      surfConditionsDay({
        maxSwellWaveHeightMeters: null,
        maxSwellWavePeriodSeconds: null,
        maxWindWaveHeightMeters: null,
      }),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-12', 100]]);
  });

  it('omits Forecast Days with no Surf Conditions Day', async () => {
    const scorer = scorerWithForecastAndSurfConditions(
      new Map([
        [plainDate('2026-07-12'), forecastDay()],
        [plainDate('2026-07-13'), forecastDay()],
      ]),
      new Map([[plainDate('2026-07-13'), surfConditionsDay()]]),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([['2026-07-13', 100]]);
  });

  it('returns no Surfing Day Scores when Forecast Lookup is unavailable', async () => {
    const scorer = new SurfingScorer(
      forecastHelperWithForecast(none<Forecast>()),
      surfConditionsHelperWithSurfConditions(
        just(surfConditionsWithDay(surfConditionsDay())),
      ),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([]);
  });

  it('returns no Surfing Day Scores when Surf Conditions Lookup is unavailable', async () => {
    const scorer = new SurfingScorer(
      forecastHelperWithForecast(just(forecastWithDay(forecastDay()))),
      surfConditionsHelperWithSurfConditions(none<SurfConditions>()),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([]);
  });

  it('returns no Surfing Day Scores when no days can be scored', async () => {
    const scorer = scorerWithForecastAndSurfConditions(
      new Map([[plainDate('2026-07-12'), forecastDay()]]),
      new Map([
        [
          plainDate('2026-07-12'),
          surfConditionsDay({ maxWaveHeightMeters: null }),
        ],
      ]),
    );

    const result = await scorer.score(sydney);

    expect(scoreEntries(result)).toEqual([]);
  });
});

function forecastDay(overrides: Partial<ForecastDay> = {}): ForecastDay {
  return {
    weatherCode: 1,
    maxTemperatureCelsius: 22,
    minTemperatureCelsius: 16,
    precipitationSumMillimeters: 0,
    precipitationProbabilityPercent: 5,
    maxWindSpeedKmh: 10,
    maxWindGustKmh: 18,
    snowfallCentimeters: 0,
    sunshineDurationHours: 8,
    ...overrides,
  };
}

function surfConditionsDay(
  overrides: Partial<SurfConditionsDay> = {},
): SurfConditionsDay {
  return {
    maxWaveHeightMeters: 1.4,
    maxWavePeriodSeconds: 12,
    dominantWaveDirectionDegrees: 120,
    maxSwellWaveHeightMeters: 1.2,
    maxSwellWavePeriodSeconds: 12,
    dominantSwellWaveDirectionDegrees: 120,
    maxWindWaveHeightMeters: 0.2,
    ...overrides,
  };
}

function scorerWithDays(
  forecastDay: ForecastDay,
  surfConditionsDay: SurfConditionsDay,
): SurfingScorer {
  return scorerWithForecastAndSurfConditions(
    forecastWithDay(forecastDay),
    surfConditionsWithDay(surfConditionsDay),
  );
}

function scorerWithForecastAndSurfConditions(
  forecast: Forecast,
  surfConditions: SurfConditions,
): SurfingScorer {
  return new SurfingScorer(
    forecastHelperWithForecast(just(forecast)),
    surfConditionsHelperWithSurfConditions(just(surfConditions)),
  );
}

function forecastHelperWithForecast(
  forecast: Awaited<ReturnType<ForecastHelper['get']>>,
): ForecastHelper {
  const forecastHelper = sinon.createStubInstance(ForecastHelper);
  forecastHelper.get.resolves(forecast);

  return forecastHelper;
}

function surfConditionsHelperWithSurfConditions(
  surfConditions: Awaited<ReturnType<SurfConditionsHelper['get']>>,
): SurfConditionsHelper {
  const surfConditionsHelper = sinon.createStubInstance(SurfConditionsHelper);
  surfConditionsHelper.get.resolves(surfConditions);

  return surfConditionsHelper;
}

function forecastWithDay(day: ForecastDay): Forecast {
  return new Map([[plainDate('2026-07-12'), day]]);
}

function surfConditionsWithDay(day: SurfConditionsDay): SurfConditions {
  return new Map([[plainDate('2026-07-12'), day]]);
}

function scoreEntries(
  result: Awaited<ReturnType<SurfingScorer['score']>>,
): Array<[string, number]> {
  return result
    .toArray()
    .map(([date, score]) => [date.toString(), score.value] as [string, number]);
}

function plainDate(value: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(value);
}
