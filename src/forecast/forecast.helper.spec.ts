import { CacheableMemory } from 'cacheable';
import sinon from 'sinon';
import { describe, expect, it } from 'vitest';
import { type Location } from '../location/location.types';
import { FORECAST_CACHE_TTL, ForecastHelper } from './forecast.helper';
import { type Forecast, type ForecastDay } from './forecast.types';
import { OpenMeteoForecastFixture } from './open-meteo-forecast.fixture';
import { OpenMeteoClient, OpenMeteoRequestError } from './open-meteo.client';

const london: Location = {
  slug: 'london-gb',
  name: 'London',
  country: { code: 'GB', name: 'United Kingdom' },
  geocoordinate: { latitude: 51.50853, longitude: -0.12574 },
};

describe('ForecastHelper.get', () => {
  it('maps Open-Meteo daily data to a date-keyed Forecast', async () => {
    const helper = createHelper(
      clientFromResponse({
        daily: {
          time: ['2026-07-12'],
          weather_code: [61],
          temperature_2m_max: [22.4],
          temperature_2m_min: [14.2],
          precipitation_sum: [3.5],
          precipitation_probability_max: [70],
          wind_speed_10m_max: [18.6],
          wind_gusts_10m_max: [31.1],
          snowfall_sum: [0],
          sunshine_duration: [19800],
        },
      }),
    );

    const result = await helper.get(london);

    expect(result.isJust()).toBe(true);
    expect(forecastEntries(result.value)).toEqual([
      [
        '2026-07-12',
        {
          weatherCode: 61,
          maxTemperatureCelsius: 22.4,
          minTemperatureCelsius: 14.2,
          precipitationSumMillimeters: 3.5,
          precipitationProbabilityPercent: 70,
          maxWindSpeedKmh: 18.6,
          maxWindGustKmh: 31.1,
          snowfallCentimeters: 0,
          sunshineDurationHours: 5.5,
        },
      ],
    ]);
  });

  it('keeps one Forecast Day per valid provider time entry with aligned partial values', async () => {
    const helper = createHelper(
      clientFromResponse({
        daily: {
          time: ['2026-07-12', 'not-a-date', '2026-07-14'],
          weather_code: [61],
          temperature_2m_max: [22.4, 23.1, null],
          temperature_2m_min: [14.2, 15.3, 16.4],
          precipitation_sum: [3.5, 0, 1.2],
          precipitation_probability_max: [70, 10, 30],
          wind_speed_10m_max: [18.6, 12.4, 9.1],
          wind_gusts_10m_max: [31.1, 24.2, 19.5],
          snowfall_sum: [0, 0, 0],
          sunshine_duration: [19800, 100, 3600],
        },
      }),
    );

    const result = await helper.get(london);

    expect(result.isJust()).toBe(true);
    expect(forecastEntries(result.value)).toEqual([
      [
        '2026-07-12',
        {
          weatherCode: 61,
          maxTemperatureCelsius: 22.4,
          minTemperatureCelsius: 14.2,
          precipitationSumMillimeters: 3.5,
          precipitationProbabilityPercent: 70,
          maxWindSpeedKmh: 18.6,
          maxWindGustKmh: 31.1,
          snowfallCentimeters: 0,
          sunshineDurationHours: 5.5,
        },
      ],
      [
        '2026-07-14',
        {
          weatherCode: null,
          maxTemperatureCelsius: null,
          minTemperatureCelsius: 16.4,
          precipitationSumMillimeters: 1.2,
          precipitationProbabilityPercent: 30,
          maxWindSpeedKmh: 9.1,
          maxWindGustKmh: 19.5,
          snowfallCentimeters: 0,
          sunshineDurationHours: 1,
        },
      ],
    ]);
  });

  it('returns Forecast Unavailable when provider data is unusable', async () => {
    const helper = createHelper(
      clientFromBody({ daily: { time: '2026-07-12' } }),
    );

    const result = await helper.get(london);

    expect(result.isNone()).toBe(true);
  });

  it('returns Forecast Unavailable when provider lookup fails', async () => {
    const helper = createHelper(failingClient(500));

    const result = await helper.get(london);

    expect(result.isNone()).toBe(true);
  });
});

function createHelper(openMeteoClient: OpenMeteoClient): ForecastHelper {
  return new ForecastHelper(
    openMeteoClient,
    new CacheableMemory({ ttl: FORECAST_CACHE_TTL, useClone: false }),
  );
}

function clientFromResponse(
  response: Parameters<typeof OpenMeteoForecastFixture.build>[0],
): OpenMeteoClient {
  return clientFromBody(OpenMeteoForecastFixture.build(response));
}

function clientFromBody(body: unknown): OpenMeteoClient {
  const openMeteoClient = sinon.createStubInstance(OpenMeteoClient);
  openMeteoClient.getForecast.resolves(body as never);
  return openMeteoClient;
}

function failingClient(statusCode: number): OpenMeteoClient {
  const openMeteoClient = sinon.createStubInstance(OpenMeteoClient);
  openMeteoClient.getForecast.rejects(
    new OpenMeteoRequestError(`Open-Meteo request failed with ${statusCode}`),
  );
  return openMeteoClient;
}

function forecastEntries(
  forecast: Forecast | undefined,
): Array<[string, ForecastDay]> {
  const entriesSource: Forecast =
    forecast ?? new Map<Temporal.PlainDate, ForecastDay>();
  return [...entriesSource.entries()].map(([date, day]) => [
    date.toString(),
    day,
  ]);
}
