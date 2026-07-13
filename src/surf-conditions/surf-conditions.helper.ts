import { Injectable } from '@nestjs/common';
import { type Maybe, just, none } from '@sweet-monads/maybe';
import { CacheableMemory } from 'cacheable';
import { Span } from 'nestjs-otel';
import { z } from 'zod';
import { type Location } from '../location/location.types';
import {
  OpenMeteoClient,
  OpenMeteoRequestError,
} from '../forecast/open-meteo.client';
import {
  type SurfConditions,
  type SurfConditionsDay,
} from './surf-conditions.types';

export const SURF_CONDITIONS_CACHE_TTL = '6h';

class SurfConditionsUnavailable extends Error {}

const ProviderMeasurementSchema = z.number().finite().nullable();
const SurfConditionsMeasurementSchema = z.preprocess(
  (value) => (value === undefined ? null : value),
  ProviderMeasurementSchema,
);

const SurfConditionsDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((value, ctx) => {
    try {
      return Temporal.PlainDate.from(value);
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Invalid surf conditions date' });
      return z.NEVER;
    }
  });

const SurfConditionsDayRowSchema = z
  .object({
    date: SurfConditionsDateSchema,
    maxWaveHeightMeters: SurfConditionsMeasurementSchema,
    maxWavePeriodSeconds: SurfConditionsMeasurementSchema,
    dominantWaveDirectionDegrees: SurfConditionsMeasurementSchema,
    maxSwellWaveHeightMeters: SurfConditionsMeasurementSchema,
    maxSwellWavePeriodSeconds: SurfConditionsMeasurementSchema,
    dominantSwellWaveDirectionDegrees: SurfConditionsMeasurementSchema,
    maxWindWaveHeightMeters: SurfConditionsMeasurementSchema,
  })
  .transform(({ date, ...day }) => {
    return [date, day satisfies SurfConditionsDay] as const;
  });

const DailySurfConditionsSchema = z
  .object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    elevation: z.number().optional(),
    generationtime_ms: z.number().optional(),
    utc_offset_seconds: z.number().optional(),
    timezone: z.string().optional(),
    timezone_abbreviation: z.string().optional(),
    daily: z
      .object({
        time: z.array(z.string()),
        wave_height_max: z.array(ProviderMeasurementSchema).optional(),
        wave_period_max: z.array(ProviderMeasurementSchema).optional(),
        wave_direction_dominant: z.array(ProviderMeasurementSchema).optional(),
        swell_wave_height_max: z.array(ProviderMeasurementSchema).optional(),
        swell_wave_period_max: z.array(ProviderMeasurementSchema).optional(),
        swell_wave_direction_dominant: z
          .array(ProviderMeasurementSchema)
          .optional(),
        wind_wave_height_max: z.array(ProviderMeasurementSchema).optional(),
      })
      .strict(),
    daily_units: z
      .object({
        time: z.string().optional(),
        wave_height_max: z.string().optional(),
        wave_period_max: z.string().optional(),
        wave_direction_dominant: z.string().optional(),
        swell_wave_height_max: z.string().optional(),
        swell_wave_period_max: z.string().optional(),
        swell_wave_direction_dominant: z.string().optional(),
        wind_wave_height_max: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

@Injectable()
export class SurfConditionsHelper {
  constructor(
    private readonly openMeteoClient: OpenMeteoClient,
    private readonly cache: CacheableMemory,
  ) {}

  @Span('surf_conditions.get')
  async get(location: Location): Promise<Maybe<SurfConditions>> {
    const getSurfConditions = this.cache.wrap(
      async () => {
        const response = await this.getProviderSurfConditions(location);
        const surfConditions = normalizeSurfConditions(response);

        if (!surfConditions) {
          throw new SurfConditionsUnavailable();
        }

        return surfConditions;
      },
      { createKey: () => location.slug, ttl: SURF_CONDITIONS_CACHE_TTL },
    );

    try {
      return just(await getSurfConditions());
    } catch (error) {
      if (error instanceof SurfConditionsUnavailable) {
        this.cache.delete(location.slug);
        return none<SurfConditions>();
      }

      throw error;
    }
  }

  private async getProviderSurfConditions(location: Location) {
    try {
      return await this.openMeteoClient.getSurfConditions(location);
    } catch (error) {
      if (error instanceof OpenMeteoRequestError) {
        throw new SurfConditionsUnavailable();
      }

      throw error;
    }
  }
}

function normalizeSurfConditions(body: unknown): SurfConditions | null {
  const parsed = DailySurfConditionsSchema.safeParse(body);
  if (!parsed.success) {
    return null;
  }

  const { daily } = parsed.data;
  const surfConditions: SurfConditions = new Map();

  daily.time.forEach((time, index) => {
    const row = SurfConditionsDayRowSchema.safeParse({
      date: time,
      maxWaveHeightMeters: daily.wave_height_max?.[index],
      maxWavePeriodSeconds: daily.wave_period_max?.[index],
      dominantWaveDirectionDegrees: daily.wave_direction_dominant?.[index],
      maxSwellWaveHeightMeters: daily.swell_wave_height_max?.[index],
      maxSwellWavePeriodSeconds: daily.swell_wave_period_max?.[index],
      dominantSwellWaveDirectionDegrees:
        daily.swell_wave_direction_dominant?.[index],
      maxWindWaveHeightMeters: daily.wind_wave_height_max?.[index],
    });

    if (row.success) {
      const [date, day] = row.data;
      surfConditions.set(date, day);
    }
  });

  return surfConditions.size > 0 ? surfConditions : null;
}
