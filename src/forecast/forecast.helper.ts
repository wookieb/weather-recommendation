import { Injectable } from '@nestjs/common';
import { type Maybe, just, none } from '@sweet-monads/maybe';
import { CacheableMemory } from 'cacheable';
import { Span } from 'nestjs-otel';
import { z } from 'zod';
import { type Location } from '../location/location.types';
import { OpenMeteoClient, OpenMeteoRequestError } from './open-meteo.client';
import { type Forecast, type ForecastDay } from './forecast.types';

export const FORECAST_CACHE_TTL = '6h';

class ForecastUnavailable extends Error {}

const ProviderMeasurementSchema = z.number().finite().nullable();
const ForecastMeasurementSchema = z.preprocess(
  (value) => (value === undefined ? null : value),
  ProviderMeasurementSchema,
);

const ForecastDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((value, ctx) => {
    try {
      return Temporal.PlainDate.from(value);
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Invalid forecast date' });
      return z.NEVER;
    }
  });

const ForecastDayRowSchema = z
  .object({
    date: ForecastDateSchema,
    weatherCode: ForecastMeasurementSchema,
    maxTemperatureCelsius: ForecastMeasurementSchema,
    minTemperatureCelsius: ForecastMeasurementSchema,
    precipitationSumMillimeters: ForecastMeasurementSchema,
    precipitationProbabilityPercent: ForecastMeasurementSchema,
    maxWindSpeedKmh: ForecastMeasurementSchema,
    maxWindGustKmh: ForecastMeasurementSchema,
    snowfallCentimeters: ForecastMeasurementSchema,
    sunshineDurationSeconds: ForecastMeasurementSchema,
  })
  .transform(({ date, sunshineDurationSeconds, ...day }) => {
    return [
      date,
      {
        ...day,
        sunshineDurationHours:
          sunshineDurationSeconds === null
            ? null
            : sunshineDurationSeconds / 3600,
      } satisfies ForecastDay,
    ] as const;
  });

const DailyForecastSchema = z
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
        weather_code: z.array(ProviderMeasurementSchema).optional(),
        temperature_2m_max: z.array(ProviderMeasurementSchema).optional(),
        temperature_2m_min: z.array(ProviderMeasurementSchema).optional(),
        precipitation_sum: z.array(ProviderMeasurementSchema).optional(),
        precipitation_probability_max: z
          .array(ProviderMeasurementSchema)
          .optional(),
        wind_speed_10m_max: z.array(ProviderMeasurementSchema).optional(),
        wind_gusts_10m_max: z.array(ProviderMeasurementSchema).optional(),
        snowfall_sum: z.array(ProviderMeasurementSchema).optional(),
        sunshine_duration: z.array(ProviderMeasurementSchema).optional(),
      })
      .strict(),
    daily_units: z
      .object({
        time: z.string().optional(),
        weather_code: z.string().optional(),
        temperature_2m_max: z.string().optional(),
        temperature_2m_min: z.string().optional(),
        precipitation_sum: z.string().optional(),
        precipitation_probability_max: z.string().optional(),
        wind_speed_10m_max: z.string().optional(),
        wind_gusts_10m_max: z.string().optional(),
        snowfall_sum: z.string().optional(),
        sunshine_duration: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

@Injectable()
export class ForecastHelper {
  constructor(
    private readonly openMeteoClient: OpenMeteoClient,
    private readonly cache: CacheableMemory,
  ) {}

  @Span('forecast.get')
  async get(location: Location): Promise<Maybe<Forecast>> {
    const getForecast = this.cache.wrap(
      async () => {
        const response = await this.getProviderForecast(location);

        const forecast = normalizeForecast(response);
        if (!forecast) {
          throw new ForecastUnavailable();
        }

        return forecast;
      },
      { createKey: () => location.slug, ttl: FORECAST_CACHE_TTL },
    );

    try {
      return just(await getForecast());
    } catch (error) {
      if (error instanceof ForecastUnavailable) {
        return none<Forecast>();
      }

      throw error;
    }
  }

  private async getProviderForecast(location: Location) {
    try {
      return await this.openMeteoClient.getForecast(location);
    } catch (error) {
      if (error instanceof OpenMeteoRequestError) {
        throw new ForecastUnavailable();
      }

      throw error;
    }
  }
}

function normalizeForecast(body: unknown): Forecast | null {
  const parsed = DailyForecastSchema.safeParse(body);
  if (!parsed.success) {
    return null;
  }

  const { daily } = parsed.data;
  const forecast: Forecast = new Map();

  daily.time.forEach((time, index) => {
    const row = ForecastDayRowSchema.safeParse({
      date: time,
      weatherCode: daily.weather_code?.[index],
      maxTemperatureCelsius: daily.temperature_2m_max?.[index],
      minTemperatureCelsius: daily.temperature_2m_min?.[index],
      precipitationSumMillimeters: daily.precipitation_sum?.[index],
      precipitationProbabilityPercent:
        daily.precipitation_probability_max?.[index],
      maxWindSpeedKmh: daily.wind_speed_10m_max?.[index],
      maxWindGustKmh: daily.wind_gusts_10m_max?.[index],
      snowfallCentimeters: daily.snowfall_sum?.[index],
      sunshineDurationSeconds: daily.sunshine_duration?.[index],
    });

    if (row.success) {
      const [date, day] = row.data;
      forecast.set(date, day);
    }
  });

  return forecast.size > 0 ? forecast : null;
}
