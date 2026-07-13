import { Injectable } from '@nestjs/common';
import { just, none, type Maybe } from '@sweet-monads/maybe';
import { Span } from 'nestjs-otel';
import { ForecastHelper } from '../forecast/forecast.helper';
import { type ForecastDay } from '../forecast/forecast.types';
import { type Location } from '../location/location.types';
import { PlainDateHashMapContext } from './plain-date-hash-map-context';
import { type RecommendationScore, type Scorer } from './scorer';

@Injectable()
export class OutdoorSightseeingRecommendationScorer implements Scorer<'outdoorSightseeing'> {
  readonly name = 'outdoorSightseeing';

  constructor(private readonly forecastHelper: ForecastHelper) {}

  @Span('scoring.outdoor_sightseeing.score')
  async score(
    location: Location,
  ): Promise<Awaited<ReturnType<Scorer<'outdoorSightseeing'>['score']>>> {
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

  let score = 85;
  const caps: number[] = [];

  score += weatherCodeScore(day);
  score += temperatureScore(day);
  score += precipitationScore(day);
  score += windScore(day);
  score += snowScore(day);
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
  ].some((value) => value === null);
}

function temperatureScore(day: ForecastDay): number {
  const max = day.maxTemperatureCelsius;
  const min = day.minTemperatureCelsius;

  if (max === null || min === null) {
    return 0;
  }

  if (max > 35 || min < 0) {
    return -55;
  }

  if (max < 10) {
    return -35;
  }

  if (max > 30) {
    return -55;
  }

  if (max >= 27 && max <= 30) {
    return -6;
  }

  if (max >= 10 && max <= 17) {
    return -6;
  }

  if (min >= 8 && max >= 18 && max <= 26) {
    return 8;
  }

  return 0;
}

function precipitationScore(day: ForecastDay): number {
  const precipitation = day.precipitationSumMillimeters;
  const probability = day.precipitationProbabilityPercent;

  if (precipitation === null || probability === null) {
    return 0;
  }

  if (precipitation > 20 || probability > 85) {
    return -30;
  }

  if (precipitation <= 2 && probability <= 50) {
    if (precipitation > 1 || probability > 30) {
      return -4;
    }

    return 0;
  }

  return -14;
}

function windScore(day: ForecastDay): number {
  const wind = day.maxWindSpeedKmh;
  const gust = day.maxWindGustKmh;

  if (wind === null || gust === null) {
    return 0;
  }

  if (wind >= 50 || gust >= 70) {
    return -23;
  }

  if (wind >= 20 || gust >= 30) {
    return -4;
  }

  return 0;
}

function weatherCodeScore(day: ForecastDay): number {
  if (isSevereWeatherCode(day.weatherCode)) {
    return -20;
  }

  return 0;
}

function snowScore(day: ForecastDay): number {
  const snowfall = day.snowfallCentimeters;

  if (snowfall === null || snowfall === 0) {
    return 0;
  }

  return snowfall > 5 ? -20 : -8;
}

function sunshineScore(day: ForecastDay): number {
  const sunshine = day.sunshineDurationHours;

  if (sunshine === null) {
    return 0;
  }

  if (sunshine >= 7) {
    return 5;
  }

  return 0;
}

function addHardCaps(day: ForecastDay, caps: number[]): void {
  if (
    (day.maxTemperatureCelsius ?? 0) > 35 ||
    (day.minTemperatureCelsius ?? 0) < 0
  ) {
    caps.push(0);
  }

  if (isSevereWeatherCode(day.weatherCode)) {
    caps.push(20);
  }

  if ((day.maxWindSpeedKmh ?? 0) >= 50 || (day.maxWindGustKmh ?? 0) >= 70) {
    caps.push(25);
  }

  if ((day.precipitationSumMillimeters ?? 0) > 20) {
    caps.push(35);
  }

  if ((day.snowfallCentimeters ?? 0) > 10) {
    caps.push(25);
  }
}

function isSevereWeatherCode(weatherCode: number | null): boolean {
  if (weatherCode === null) {
    return false;
  }

  return SEVERE_OUTDOOR_SIGHTSEEING_WEATHER_CODES.includes(weatherCode);
}

enum SevereOutdoorSightseeingWeatherCode {
  FreezingDrizzleDense = 57,
  RainHeavy = 65,
  FreezingRainHeavy = 67,
  SnowfallHeavy = 75,
  RainShowersViolent = 82,
  SnowShowersHeavy = 86,
  Thunderstorm = 95,
  ThunderstormWithSlightHail = 96,
  ThunderstormWithHeavyHail = 99,
}

const SEVERE_OUTDOOR_SIGHTSEEING_WEATHER_CODES = [
  SevereOutdoorSightseeingWeatherCode.FreezingDrizzleDense,
  SevereOutdoorSightseeingWeatherCode.RainHeavy,
  SevereOutdoorSightseeingWeatherCode.FreezingRainHeavy,
  SevereOutdoorSightseeingWeatherCode.SnowfallHeavy,
  SevereOutdoorSightseeingWeatherCode.RainShowersViolent,
  SevereOutdoorSightseeingWeatherCode.SnowShowersHeavy,
  SevereOutdoorSightseeingWeatherCode.Thunderstorm,
  SevereOutdoorSightseeingWeatherCode.ThunderstormWithSlightHail,
  SevereOutdoorSightseeingWeatherCode.ThunderstormWithHeavyHail,
] as const;
