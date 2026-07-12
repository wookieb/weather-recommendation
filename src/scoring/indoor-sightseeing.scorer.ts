import { Injectable } from '@nestjs/common';
import { type Maybe, just, none } from '@sweet-monads/maybe';
import { ForecastHelper } from '../forecast/forecast.helper';
import { type ForecastDay } from '../forecast/forecast.types';
import { type Location } from '../location/location.types';
import { PlainDateHashMapContext } from './plain-date-hash-map-context';
import { type RecommendationScore, type Scorer } from './scorer';

@Injectable()
export class IndoorSightseeingScorer implements Scorer<'indoorSightseeing'> {
  readonly name = 'indoorSightseeing';

  constructor(private readonly forecastHelper: ForecastHelper) {}

  async score(
    location: Location,
  ): Promise<Awaited<ReturnType<Scorer<'indoorSightseeing'>['score']>>> {
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

  score += precipitationAdjustment(day);
  score += temperatureAdjustment(day);
  score += windAdjustment(day);
  score += weatherCodeAdjustment(day);
  score += sunshineAdjustment(day);
  score += snowfallAdjustment(day);

  addHardCaps(day, caps);

  const clamped = Math.min(100, Math.max(0, score));
  return just(Math.min(clamped, ...caps));
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

function precipitationAdjustment(day: ForecastDay): number {
  const precipitation = day.precipitationSumMillimeters ?? 0;
  const probability = day.precipitationProbabilityPercent ?? 0;

  if (precipitation > 20 || probability > 85) {
    return 25;
  }

  if (precipitation > 5 || probability > 60) {
    return 20;
  }

  if (precipitation >= 1 || probability >= 30) {
    return 10;
  }

  return 0;
}

function temperatureAdjustment(day: ForecastDay): number {
  const max = day.maxTemperatureCelsius ?? 0;
  const min = day.minTemperatureCelsius ?? 0;

  if (max > 30 || max < 10 || min < 0) {
    return 20;
  }

  if ((max >= 10 && max <= 17) || (max >= 27 && max <= 30) || min <= 7) {
    return 10;
  }

  if (min >= 8 && max >= 18 && max <= 26) {
    return -10;
  }

  return 0;
}

function windAdjustment(day: ForecastDay): number {
  const wind = day.maxWindSpeedKmh ?? 0;
  const gust = day.maxWindGustKmh ?? 0;

  if (wind >= 50 || gust >= 70) {
    return -10;
  }

  if (wind >= 35 || gust >= 50) {
    return 15;
  }

  if (wind >= 20 || gust >= 30) {
    return 10;
  }

  return 0;
}

function weatherCodeAdjustment(day: ForecastDay): number {
  const weatherCode = day.weatherCode ?? 0;

  if (weatherCode === 0 || weatherCode === 1) {
    return -5;
  }

  if ([2, 3, 45, 48].includes(weatherCode)) {
    return 5;
  }

  return 0;
}

function sunshineAdjustment(day: ForecastDay): number {
  const sunshine = day.sunshineDurationHours;
  if (sunshine === null) {
    return 0;
  }

  if (sunshine < 2) {
    return 10;
  }

  if (sunshine <= 5) {
    return 5;
  }

  if (sunshine <= 8) {
    return 0;
  }

  return -10;
}

function snowfallAdjustment(day: ForecastDay): number {
  const snowfall = day.snowfallCentimeters;
  if (snowfall === null || snowfall === 0) {
    return 0;
  }

  if (snowfall <= 2) {
    return 5;
  }

  if (snowfall <= 10) {
    return 10;
  }

  if (snowfall <= 20) {
    return 5;
  }

  return -10;
}

function addHardCaps(day: ForecastDay, caps: number[]): void {
  if ((day.precipitationSumMillimeters ?? 0) > 40) {
    caps.push(55);
  }

  if (
    (day.maxTemperatureCelsius ?? 0) > 38 ||
    (day.minTemperatureCelsius ?? 0) < -15
  ) {
    caps.push(60);
  }

  if ((day.maxWindSpeedKmh ?? 0) >= 50 || (day.maxWindGustKmh ?? 0) >= 70) {
    caps.push(45);
  }

  if ([57, 65, 67, 75, 82, 86, 95, 96, 99].includes(day.weatherCode ?? 0)) {
    caps.push(50);
  }

  const snowfall = day.snowfallCentimeters ?? 0;
  if (snowfall > 20) {
    caps.push(45);
  } else if (snowfall > 10) {
    caps.push(65);
  }
}
