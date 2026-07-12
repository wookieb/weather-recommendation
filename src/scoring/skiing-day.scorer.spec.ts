import { just, none } from '@sweet-monads/maybe';
import sinon from 'sinon';
import { describe, expect, it } from 'vitest';
import { ForecastHelper } from '../forecast/forecast.helper';
import { type Forecast, type ForecastDay } from '../forecast/forecast.types';
import { type Location } from '../location/location.types';
import { SkiingDayScorer } from './skiing-day.scorer';

const innsbruck: Location = {
  slug: 'innsbruck-at',
  name: 'Innsbruck',
  country: { code: 'AT', name: 'Austria' },
  geocoordinate: { latitude: 47.26921, longitude: 11.404102 },
};

describe('SkiingDayScorer.score', () => {
  it('scores good, borderline, and bad Skiing Forecast Days', async () => {
    const scorer = scorerWithForecast(
      new Map([
        [
          plainDate('2026-01-12'),
          forecastDay({
            weatherCode: 71,
            maxTemperatureCelsius: -3,
            minTemperatureCelsius: -9,
            precipitationSumMillimeters: 4,
            precipitationProbabilityPercent: 55,
            maxWindSpeedKmh: 18,
            maxWindGustKmh: 30,
            snowfallCentimeters: 7,
            sunshineDurationHours: 3,
          }),
        ],
        [
          plainDate('2026-01-13'),
          forecastDay({
            weatherCode: 73,
            maxTemperatureCelsius: 2,
            minTemperatureCelsius: -3,
            precipitationSumMillimeters: 3,
            precipitationProbabilityPercent: 60,
            maxWindSpeedKmh: 28,
            maxWindGustKmh: 42,
            snowfallCentimeters: 2,
            sunshineDurationHours: 1,
          }),
        ],
        [
          plainDate('2026-01-14'),
          forecastDay({
            weatherCode: 65,
            maxTemperatureCelsius: 8,
            minTemperatureCelsius: 3,
            precipitationSumMillimeters: 18,
            precipitationProbabilityPercent: 90,
            maxWindSpeedKmh: 38,
            maxWindGustKmh: 60,
            snowfallCentimeters: 0,
            sunshineDurationHours: 0,
          }),
        ],
      ]),
    );

    const result = await scorer.score(innsbruck);

    expect(scoreEntries(result)).toEqual([
      ['2026-01-12', 95],
      ['2026-01-13', 60],
      ['2026-01-14', 15],
    ]);
  });

  it('returns no score for a Forecast Day missing a required Skiing signal', async () => {
    const scorer = scorerWithForecast(
      new Map([
        [
          plainDate('2026-01-12'),
          forecastDay({
            weatherCode: 71,
            maxTemperatureCelsius: -3,
            minTemperatureCelsius: -9,
            precipitationSumMillimeters: 4,
            precipitationProbabilityPercent: 55,
            maxWindSpeedKmh: 18,
            maxWindGustKmh: 30,
            snowfallCentimeters: null,
            sunshineDurationHours: 3,
          }),
        ],
      ]),
    );

    const result = await scorer.score(innsbruck);

    expect(maybeScoreEntries(result)).toEqual([['2026-01-12', null]]);
  });

  it('treats missing sunshine as neutral for a Skiing Forecast Day', async () => {
    const scorer = scorerWithForecast(
      new Map([
        [
          plainDate('2026-01-12'),
          forecastDay({
            weatherCode: 71,
            maxTemperatureCelsius: -3,
            minTemperatureCelsius: -9,
            precipitationSumMillimeters: 4,
            precipitationProbabilityPercent: 55,
            maxWindSpeedKmh: 18,
            maxWindGustKmh: 30,
            snowfallCentimeters: 7,
            sunshineDurationHours: null,
          }),
        ],
      ]),
    );

    const result = await scorer.score(innsbruck);

    expect(scoreEntries(result)).toEqual([['2026-01-12', 95]]);
  });

  it('scores no-snow above-freezing Forecast Days as bad for Skiing', async () => {
    const scorer = scorerWithForecast(
      new Map([
        [
          plainDate('2026-01-12'),
          forecastDay({
            weatherCode: 1,
            maxTemperatureCelsius: 4,
            minTemperatureCelsius: 1,
            precipitationSumMillimeters: 0,
            precipitationProbabilityPercent: 5,
            maxWindSpeedKmh: 12,
            maxWindGustKmh: 20,
            snowfallCentimeters: 0,
            sunshineDurationHours: 6,
          }),
        ],
      ]),
    );

    const result = await scorer.score(innsbruck);

    expect(scoreEntries(result)).toEqual([['2026-01-12', 35]]);
  });

  it('applies a moderate visibility penalty to foggy Skiing Forecast Days', async () => {
    const scorer = scorerWithForecast(
      new Map([
        [
          plainDate('2026-01-12'),
          forecastDay({
            weatherCode: 45,
            maxTemperatureCelsius: -3,
            minTemperatureCelsius: -9,
            precipitationSumMillimeters: 4,
            precipitationProbabilityPercent: 55,
            maxWindSpeedKmh: 18,
            maxWindGustKmh: 30,
            snowfallCentimeters: 7,
            sunshineDurationHours: 3,
          }),
        ],
      ]),
    );

    const result = await scorer.score(innsbruck);

    expect(scoreEntries(result)).toEqual([['2026-01-12', 80]]);
  });

  it('returns no Forecast Days when Forecast Lookup is unavailable', async () => {
    const forecastHelper = sinon.createStubInstance(ForecastHelper);
    forecastHelper.get.resolves(none<Forecast>());
    const scorer = new SkiingDayScorer(forecastHelper);

    const result = await scorer.score(innsbruck);

    expect(scoreEntries(result)).toEqual([]);
  });
});

function scorerWithForecast(forecast: Forecast): SkiingDayScorer {
  const forecastHelper = sinon.createStubInstance(ForecastHelper);
  forecastHelper.get.resolves(just(forecast));

  return new SkiingDayScorer(forecastHelper);
}

function scoreEntries(
  result: Awaited<ReturnType<SkiingDayScorer['score']>>,
): Array<[string, number]> {
  return result
    .toArray()
    .map(([date, score]) => [date.toString(), score.value] as [string, number])
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate));
}

function maybeScoreEntries(
  result: Awaited<ReturnType<SkiingDayScorer['score']>>,
): Array<[string, number | null]> {
  return result
    .toArray()
    .map(([date, score]) => [
      date.toString(),
      score.isJust() ? score.value : null,
    ]);
}

function forecastDay(overrides: ForecastDay): ForecastDay {
  return overrides;
}

function plainDate(value: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(value);
}
