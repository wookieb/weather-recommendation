import { Client, type Dispatcher } from 'undici';
import { Span } from 'nestjs-otel';
import { z } from 'zod';
import { type Location } from '../location/location.types';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com';
const OPEN_METEO_FORECAST_PATH = '/v1/forecast';
const OPEN_METEO_MARINE_PATH = '/v1/marine';
const DAILY_VARIABLES = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'snowfall_sum',
  'sunshine_duration',
] as const;
const MARINE_DAILY_VARIABLES = [
  'wave_height_max',
  'wave_period_max',
  'wave_direction_dominant',
  'swell_wave_height_max',
  'swell_wave_period_max',
  'swell_wave_direction_dominant',
  'wind_wave_height_max',
] as const;

export type OpenMeteoDailyVariable = (typeof DAILY_VARIABLES)[number];
export type OpenMeteoForecastResponse = z.infer<
  typeof OpenMeteoForecastResponseSchema
>;
export type OpenMeteoSurfConditionsResponse = z.infer<
  typeof OpenMeteoSurfConditionsResponseSchema
>;

const OpenMeteoForecastResponseSchema = z
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
        weather_code: z.array(z.number().nullable()).optional(),
        temperature_2m_max: z.array(z.number().nullable()).optional(),
        temperature_2m_min: z.array(z.number().nullable()).optional(),
        precipitation_sum: z.array(z.number().nullable()).optional(),
        precipitation_probability_max: z
          .array(z.number().nullable())
          .optional(),
        wind_speed_10m_max: z.array(z.number().nullable()).optional(),
        wind_gusts_10m_max: z.array(z.number().nullable()).optional(),
        snowfall_sum: z.array(z.number().nullable()).optional(),
        sunshine_duration: z.array(z.number().nullable()).optional(),
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

const OpenMeteoSurfConditionsResponseSchema = z
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
        wave_height_max: z.array(z.number().nullable()).optional(),
        wave_period_max: z.array(z.number().nullable()).optional(),
        wave_direction_dominant: z.array(z.number().nullable()).optional(),
        swell_wave_height_max: z.array(z.number().nullable()).optional(),
        swell_wave_period_max: z.array(z.number().nullable()).optional(),
        swell_wave_direction_dominant: z
          .array(z.number().nullable())
          .optional(),
        wind_wave_height_max: z.array(z.number().nullable()).optional(),
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

export class OpenMeteoRequestError extends Error {}

export class OpenMeteoClient {
  constructor(
    private readonly forecastClient: Client,
    private readonly marineClient: Client = forecastClient,
  ) {}

  @Span('open_meteo.forecast.get')
  async getForecast(location: Location): Promise<OpenMeteoForecastResponse> {
    try {
      const response = await this.forecastClient.request(
        this.buildForecastRequest(location),
      );
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new OpenMeteoRequestError(
          `Open-Meteo request failed with ${response.statusCode}`,
        );
      }

      return OpenMeteoForecastResponseSchema.parse(await response.body.json());
    } catch (error) {
      if (error instanceof OpenMeteoRequestError) {
        throw error;
      }

      throw new OpenMeteoRequestError('Open-Meteo request failed', {
        cause: error,
      });
    }
  }

  @Span('open_meteo.surf_conditions.get')
  async getSurfConditions(
    location: Location,
  ): Promise<OpenMeteoSurfConditionsResponse> {
    try {
      const response = await this.marineClient.request(
        this.buildSurfConditionsRequest(location),
      );
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new OpenMeteoRequestError(
          `Open-Meteo request failed with ${response.statusCode}`,
        );
      }

      return OpenMeteoSurfConditionsResponseSchema.parse(
        await response.body.json(),
      );
    } catch (error) {
      if (error instanceof OpenMeteoRequestError) {
        throw error;
      }

      throw new OpenMeteoRequestError('Open-Meteo request failed', {
        cause: error,
      });
    }
  }

  private buildForecastRequest(location: Location): Dispatcher.RequestOptions {
    const url = new URL(OPEN_METEO_FORECAST_PATH, OPEN_METEO_BASE_URL);
    url.searchParams.set('latitude', String(location.geocoordinate.latitude));
    url.searchParams.set('longitude', String(location.geocoordinate.longitude));
    url.searchParams.set('forecast_days', '7');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('temperature_unit', 'celsius');
    url.searchParams.set('windspeed_unit', 'kmh');
    url.searchParams.set('precipitation_unit', 'mm');
    url.searchParams.set('daily', DAILY_VARIABLES.join(','));

    return {
      method: 'GET',
      path: `${url.pathname}${url.search}`,
    };
  }

  private buildSurfConditionsRequest(
    location: Location,
  ): Dispatcher.RequestOptions {
    const url = new URL(OPEN_METEO_MARINE_PATH, OPEN_METEO_BASE_URL);
    url.searchParams.set('latitude', String(location.geocoordinate.latitude));
    url.searchParams.set('longitude', String(location.geocoordinate.longitude));
    url.searchParams.set('forecast_days', '7');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('cell_selection', 'sea');
    url.searchParams.set('length_unit', 'metric');
    url.searchParams.set('daily', MARINE_DAILY_VARIABLES.join(','));

    return {
      method: 'GET',
      path: `${url.pathname}${url.search}`,
    };
  }
}
