import { Injectable } from '@nestjs/common';
import { type HashMap } from '@rimbu/hashed';
import { just, none, type Maybe } from '@sweet-monads/maybe';
import { Span } from 'nestjs-otel';
import { ForecastHelper } from '../forecast/forecast.helper';
import { type ForecastDay } from '../forecast/forecast.types';
import { type Location } from '../location/location.types';
import { PlainDateHashMapContext } from './plain-date-hash-map-context';
import { type RecommendationScore, type Scorer } from './scorer';

@Injectable()
export class SkiingDayScorer implements Scorer<'skiing'> {
  readonly name = 'skiing';

  constructor(private readonly forecastHelper: ForecastHelper) {}

  @Span('scoring.skiing.score')
  async score(
    location: Location,
  ): Promise<HashMap<Temporal.PlainDate, Maybe<RecommendationScore>>> {
    const forecast = await this.forecastHelper.get(location);
    if (forecast.isNone()) {
      return PlainDateHashMapContext.empty<
        Temporal.PlainDate,
        Maybe<RecommendationScore>
      >();
    }

    let result = PlainDateHashMapContext.empty<
      Temporal.PlainDate,
      Maybe<RecommendationScore>
    >();

    for (const [date, day] of forecast.value.entries()) {
      result = result.set(date, scoreForecastDay(day));
    }

    return result;
  }
}

function scoreForecastDay(day: ForecastDay): Maybe<RecommendationScore> {
  if (hasMissingRequiredField(day)) {
    return none();
  }

  let score = 50;
  const caps: number[] = [];

  score += temperatureScore(day);
  score += snowfallScore(day);
  score += precipitationScore(day);
  score += weatherCodeScore(day);
  score += windScore(day);
  score += sunshineScore(day);

  addHardCaps(day, caps);

  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  return just(caps.length === 0 ? clamped : Math.min(clamped, ...caps));
}

function hasMissingRequiredField(day: ForecastDay): boolean {
  return [
    day.weatherCode,
    day.maxTemperatureCelsius,
    day.minTemperatureCelsius,
    day.precipitationSumMillimeters,
    day.precipitationProbabilityPercent,
    day.maxWindSpeedKmh,
    day.maxWindGustKmh,
    day.snowfallCentimeters,
  ].some((value) => value === null);
}

function temperatureScore(day: ForecastDay): number {
  const max = day.maxTemperatureCelsius ?? 0;
  const min = day.minTemperatureCelsius ?? 0;

  if (min < -22) {
    return -25;
  }

  if (max <= -1 && min >= -18) {
    return 20;
  }

  if (max <= 2 && min >= -18) {
    return 10;
  }

  if (max > 6) {
    return -15;
  }

  if (max > 2) {
    return -5;
  }

  return 0;
}

function snowfallScore(day: ForecastDay): number {
  const snowfall = day.snowfallCentimeters ?? 0;

  if (snowfall >= 4 && snowfall <= 12) {
    return 20;
  }

  if (snowfall > 0 && snowfall < 4) {
    return 10;
  }

  if (snowfall > 12 && snowfall <= 20) {
    return 5;
  }

  if (snowfall > 20) {
    return -5;
  }

  return 0;
}

function precipitationScore(day: ForecastDay): number {
  const precipitation = day.precipitationSumMillimeters ?? 0;
  const probability = day.precipitationProbabilityPercent ?? 0;

  if (isRainCode(day.weatherCode)) {
    if (precipitation >= 10 || probability >= 80) {
      return -10;
    }

    return -5;
  }

  const snowfall = day.snowfallCentimeters ?? 0;

  if (isSnowCode(day.weatherCode) && snowfall > 0) {
    if (precipitation > 15) {
      return -5;
    }

    if (snowfall >= 4 && precipitation <= 8 && probability <= 70) {
      return 5;
    }

    return 0;
  }

  if (precipitation > 10 || probability > 75) {
    return -10;
  }

  if (precipitation > 2 || probability > 50) {
    return -5;
  }

  return 0;
}

function windScore(day: ForecastDay): number {
  const wind = day.maxWindSpeedKmh ?? 0;
  const gust = day.maxWindGustKmh ?? 0;

  if (wind >= 50 || gust >= 70) {
    return -30;
  }

  if (wind >= 25 || gust >= 40) {
    return -10;
  }

  return 0;
}

function weatherCodeScore(day: ForecastDay): number {
  if (isFogCode(day.weatherCode)) {
    return -5;
  }

  return 0;
}

function sunshineScore(day: ForecastDay): number {
  const sunshine = day.sunshineDurationHours;
  if (sunshine === null) {
    return 0;
  }

  if (sunshine >= 5) {
    return 5;
  }

  return 0;
}

function addHardCaps(day: ForecastDay, caps: number[]): void {
  const max = day.maxTemperatureCelsius ?? 0;
  const min = day.minTemperatureCelsius ?? 0;
  const wind = day.maxWindSpeedKmh ?? 0;
  const gust = day.maxWindGustKmh ?? 0;
  const snowfall = day.snowfallCentimeters ?? 0;

  if (max >= 8) {
    caps.push(35);
  }

  if (max > 0 && snowfall === 0) {
    caps.push(35);
  }

  if (min < -22) {
    caps.push(60);
  }

  if (wind >= 50 || gust >= 70) {
    caps.push(35);
  }

  if (isSevereWeatherCode(day.weatherCode)) {
    caps.push(35);
  }

  if (snowfall > 30) {
    caps.push(45);
  } else if (snowfall > 20) {
    caps.push(65);
  }
}

function isRainCode(weatherCode: number | null): boolean {
  return weatherCode !== null && RAIN_CODES.includes(weatherCode);
}

function isSnowCode(weatherCode: number | null): boolean {
  return weatherCode !== null && SNOW_CODES.includes(weatherCode);
}

function isSevereWeatherCode(weatherCode: number | null): boolean {
  return weatherCode !== null && SEVERE_WEATHER_CODES.includes(weatherCode);
}

function isFogCode(weatherCode: number | null): boolean {
  return weatherCode !== null && FOG_CODES.includes(weatherCode);
}

const RAIN_CODES: readonly number[] = [
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82,
];
const SNOW_CODES: readonly number[] = [71, 73, 75, 77, 85, 86];
const SEVERE_WEATHER_CODES: readonly number[] = [
  56, 57, 65, 66, 67, 75, 82, 86, 95, 96, 99,
];
const FOG_CODES: readonly number[] = [45, 48];
