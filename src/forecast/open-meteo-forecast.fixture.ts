import { Factory } from 'fishery';
import { type OpenMeteoForecastResponse } from './open-meteo.client';

export const OpenMeteoForecastFixture =
  Factory.define<OpenMeteoForecastResponse>(() => ({
    latitude: 51.5,
    longitude: -0.12,
    generationtime_ms: 1,
    utc_offset_seconds: 3600,
    timezone: 'Europe/London',
    timezone_abbreviation: 'GMT',
    elevation: 25,
    daily_units: {
      time: 'iso8601',
      weather_code: 'wmo code',
      temperature_2m_max: '°C',
      temperature_2m_min: '°C',
      precipitation_sum: 'mm',
      precipitation_probability_max: '%',
      wind_speed_10m_max: 'km/h',
      wind_gusts_10m_max: 'km/h',
      snowfall_sum: 'cm',
      sunshine_duration: 's',
    },
    daily: {
      time: ['2026-07-12'],
      weather_code: [0],
      temperature_2m_max: [20],
      temperature_2m_min: [10],
      precipitation_sum: [0],
      precipitation_probability_max: [0],
      wind_speed_10m_max: [5],
      wind_gusts_10m_max: [8],
      snowfall_sum: [0],
      sunshine_duration: [3600],
    },
  }));
