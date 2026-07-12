import { CacheableMemory } from 'cacheable';
import sinon from 'sinon';
import { describe, expect, it } from 'vitest';
import { type Location } from '../location/location.types';
import {
  SURF_CONDITIONS_CACHE_TTL,
  SurfConditionsHelper,
} from './surf-conditions.helper';
import {
  OpenMeteoClient,
  OpenMeteoRequestError,
} from '../forecast/open-meteo.client';
import {
  type SurfConditions,
  type SurfConditionsDay,
} from './surf-conditions.types';

const sydney: Location = {
  slug: 'sydney-au',
  name: 'Sydney',
  country: { code: 'AU', name: 'Australia' },
  geocoordinate: { latitude: -33.86785, longitude: 151.20732 },
};

describe('SurfConditionsHelper.get', () => {
  it('maps Open-Meteo daily marine data to date-keyed Surf Conditions', async () => {
    const helper = createHelper(
      clientFromBody({
        daily: {
          time: ['2026-07-12'],
          wave_height_max: [1.8],
          wave_period_max: [9.2],
          wave_direction_dominant: [135],
          swell_wave_height_max: [1.2],
          swell_wave_period_max: [11.4],
          swell_wave_direction_dominant: [120],
          wind_wave_height_max: [0.7],
        },
      }),
    );

    const result = await helper.get(sydney);

    expect(result.isJust()).toBe(true);
    expect(surfConditionsEntries(result.value)).toEqual([
      [
        '2026-07-12',
        {
          maxWaveHeightMeters: 1.8,
          maxWavePeriodSeconds: 9.2,
          dominantWaveDirectionDegrees: 135,
          maxSwellWaveHeightMeters: 1.2,
          maxSwellWavePeriodSeconds: 11.4,
          dominantSwellWaveDirectionDegrees: 120,
          maxWindWaveHeightMeters: 0.7,
        },
      ],
    ]);
  });

  it('keeps one Surf Conditions Day per valid provider time entry with aligned partial values', async () => {
    const helper = createHelper(
      clientFromBody({
        daily: {
          time: ['2026-07-12', 'not-a-date', '2026-07-14'],
          wave_height_max: [1.8],
          wave_period_max: [9.2, 8.1, null],
          wave_direction_dominant: [135, 90, 220],
          swell_wave_height_max: [1.2, 0.9, 0.4],
          swell_wave_period_max: [11.4, 10.1, 7.5],
          swell_wave_direction_dominant: [120, 80, 210],
          wind_wave_height_max: [0.7, 0.6, 0.2],
        },
      }),
    );

    const result = await helper.get(sydney);

    expect(result.isJust()).toBe(true);
    expect(surfConditionsEntries(result.value)).toEqual([
      [
        '2026-07-12',
        {
          maxWaveHeightMeters: 1.8,
          maxWavePeriodSeconds: 9.2,
          dominantWaveDirectionDegrees: 135,
          maxSwellWaveHeightMeters: 1.2,
          maxSwellWavePeriodSeconds: 11.4,
          dominantSwellWaveDirectionDegrees: 120,
          maxWindWaveHeightMeters: 0.7,
        },
      ],
      [
        '2026-07-14',
        {
          maxWaveHeightMeters: null,
          maxWavePeriodSeconds: null,
          dominantWaveDirectionDegrees: 220,
          maxSwellWaveHeightMeters: 0.4,
          maxSwellWavePeriodSeconds: 7.5,
          dominantSwellWaveDirectionDegrees: 210,
          maxWindWaveHeightMeters: 0.2,
        },
      ],
    ]);
  });

  it('returns Surf Conditions Unavailable when provider data is unusable', async () => {
    const helper = createHelper(
      clientFromBody({ daily: { time: '2026-07-12' } }),
    );

    const result = await helper.get(sydney);

    expect(result.isNone()).toBe(true);
  });

  it('returns Surf Conditions Unavailable when no usable days exist', async () => {
    const helper = createHelper(
      clientFromBody({ daily: { time: ['not-a-date'] } }),
    );

    const result = await helper.get(sydney);

    expect(result.isNone()).toBe(true);
  });

  it('returns Surf Conditions Unavailable when provider lookup fails', async () => {
    const helper = createHelper(failingClient(500));

    const result = await helper.get(sydney);

    expect(result.isNone()).toBe(true);
  });

  it('caches successful Surf Conditions by Location Slug', async () => {
    const openMeteoClient = clientFromBody({
      daily: {
        time: ['2026-07-12'],
        wave_height_max: [1.8],
      },
    });
    const helper = createHelper(openMeteoClient);

    await helper.get(sydney);
    await helper.get({ ...sydney, name: 'Sydney coastal lookup' });

    expect(surfConditionsLookupCount(openMeteoClient)).toBe(1);
  });

  it('does not cache Surf Conditions Unavailable', async () => {
    const openMeteoClient = sinon.createStubInstance(OpenMeteoClient);
    openMeteoClient.getSurfConditions
      .onFirstCall()
      .rejects(new OpenMeteoRequestError('Open-Meteo request failed with 500'));
    openMeteoClient.getSurfConditions.onSecondCall().resolves({
      daily: {
        time: ['2026-07-12'],
        wave_height_max: [1.8],
      },
    });
    const helper = createHelper(openMeteoClient);

    const unavailable = await helper.get(sydney);
    const available = await helper.get(sydney);

    expect(unavailable.isNone()).toBe(true);
    expect(available.isJust()).toBe(true);
    expect(surfConditionsLookupCount(openMeteoClient)).toBe(2);
  });
});

function createHelper(openMeteoClient: OpenMeteoClient): SurfConditionsHelper {
  return new SurfConditionsHelper(
    openMeteoClient,
    new CacheableMemory({ ttl: SURF_CONDITIONS_CACHE_TTL, useClone: false }),
  );
}

function clientFromBody(body: unknown): OpenMeteoClient {
  const openMeteoClient = sinon.createStubInstance(OpenMeteoClient);
  openMeteoClient.getSurfConditions.resolves(body as never);
  return openMeteoClient;
}

function failingClient(statusCode: number): OpenMeteoClient {
  const openMeteoClient = sinon.createStubInstance(OpenMeteoClient);
  openMeteoClient.getSurfConditions.rejects(
    new OpenMeteoRequestError(`Open-Meteo request failed with ${statusCode}`),
  );
  return openMeteoClient;
}

function surfConditionsLookupCount(openMeteoClient: OpenMeteoClient): number {
  return (openMeteoClient.getSurfConditions as unknown as sinon.SinonStub)
    .callCount;
}

function surfConditionsEntries(
  surfConditions: SurfConditions | undefined,
): Array<[string, SurfConditionsDay]> {
  const entriesSource: SurfConditions =
    surfConditions ?? new Map<Temporal.PlainDate, SurfConditionsDay>();
  return [...entriesSource.entries()].map(([date, day]) => [
    date.toString(),
    day,
  ]);
}
