import { Injectable } from '@nestjs/common';
import { type HashMap } from '@rimbu/hashed';
import { just, type Maybe } from '@sweet-monads/maybe';
import { Span } from 'nestjs-otel';
import { ForecastHelper } from '../forecast/forecast.helper';
import { type ForecastDay } from '../forecast/forecast.types';
import { type Location } from '../location/location.types';
import { SurfConditionsHelper } from '../surf-conditions/surf-conditions.helper';
import { type SurfConditionsDay } from '../surf-conditions/surf-conditions.types';
import { PlainDateHashMapContext } from './plain-date-hash-map-context';
import { type RecommendationScore, type Scorer } from './scorer';

@Injectable()
export class SurfingScorer implements Scorer<'surfing'> {
  readonly name = 'surfing';

  constructor(
    private readonly forecastHelper: ForecastHelper,
    private readonly surfConditionsHelper: SurfConditionsHelper,
  ) {}

  @Span('scoring.surfing.score')
  async score(
    location: Location,
  ): Promise<HashMap<Temporal.PlainDate, Maybe<RecommendationScore>>> {
    const [forecast, surfConditions] = await Promise.all([
      this.forecastHelper.get(location),
      this.surfConditionsHelper.get(location),
    ]);

    let result = PlainDateHashMapContext.empty<
      Temporal.PlainDate,
      Maybe<RecommendationScore>
    >();

    if (forecast.isNone() || surfConditions.isNone()) {
      return result;
    }

    const surfConditionsByDate = new Map(
      [...surfConditions.value.entries()].map(([date, day]) => [
        date.toString(),
        day,
      ]),
    );

    for (const [date, forecastDay] of forecast.value.entries()) {
      const surfConditionsDay = surfConditionsByDate.get(date.toString());
      if (
        surfConditionsDay &&
        !hasMissingRequiredForecastField(forecastDay) &&
        !hasMissingRequiredSurfConditionsField(surfConditionsDay)
      ) {
        result = result.set(
          date,
          just(scoreSurfConditionsDay(forecastDay, surfConditionsDay)),
        );
      }
    }

    return result;
  }
}

function hasMissingRequiredForecastField(day: ForecastDay): boolean {
  return [
    day.weatherCode,
    day.maxTemperatureCelsius,
    day.minTemperatureCelsius,
    day.precipitationSumMillimeters,
    day.precipitationProbabilityPercent,
    day.maxWindSpeedKmh,
    day.maxWindGustKmh,
    day.snowfallCentimeters,
    day.sunshineDurationHours,
  ].some((value) => value === null);
}

function hasMissingRequiredSurfConditionsField(
  day: SurfConditionsDay,
): boolean {
  return [
    day.maxWaveHeightMeters,
    day.maxWavePeriodSeconds,
    day.dominantWaveDirectionDegrees,
    day.dominantSwellWaveDirectionDegrees,
  ].some((value) => value === null);
}

function scoreSurfConditionsDay(
  forecastDay: ForecastDay,
  surfConditionsDay: SurfConditionsDay,
): RecommendationScore {
  if (hasSafetyVeto(forecastDay)) {
    return 0;
  }

  if ((surfConditionsDay.maxWaveHeightMeters ?? 0) >= 4) {
    return 0;
  }

  if ((surfConditionsDay.maxWavePeriodSeconds ?? 0) <= 5) {
    return 30;
  }

  if ((surfConditionsDay.maxWaveHeightMeters ?? 0) <= 0.3) {
    return 15;
  }

  if (
    (surfConditionsDay.maxWaveHeightMeters ?? 0) <= 0.6 &&
    (surfConditionsDay.maxWavePeriodSeconds ?? 0) <= 8
  ) {
    return applyWeatherAdjustments(52, forecastDay);
  }

  return applyWeatherAdjustments(100, forecastDay);
}

function applyWeatherAdjustments(
  score: RecommendationScore,
  day: ForecastDay,
): RecommendationScore {
  let adjustedScore = score;

  adjustedScore += temperatureAdjustment(day);
  adjustedScore += precipitationAdjustment(day);
  adjustedScore += sunshineAdjustment(day);
  adjustedScore += snowfallAdjustment(day);

  return Math.min(100, Math.max(0, Math.round(adjustedScore)));
}

function temperatureAdjustment(day: ForecastDay): number {
  const max = day.maxTemperatureCelsius ?? 0;
  const min = day.minTemperatureCelsius ?? 0;

  if (max > 35 || min < 0) {
    return -30;
  }

  if (max > 30 || max < 10 || min < 5) {
    return -15;
  }

  return 0;
}

function precipitationAdjustment(day: ForecastDay): number {
  const precipitation = day.precipitationSumMillimeters ?? 0;
  const probability = day.precipitationProbabilityPercent ?? 0;

  if (precipitation > 5 || probability > 85) {
    return -20;
  }

  if (precipitation >= 1 || probability >= 30) {
    return -10;
  }

  return 0;
}

function sunshineAdjustment(day: ForecastDay): number {
  const sunshine = day.sunshineDurationHours ?? 0;

  if (sunshine < 2) {
    return -10;
  }

  return 0;
}

function snowfallAdjustment(day: ForecastDay): number {
  const snowfall = day.snowfallCentimeters ?? 0;

  if (snowfall > 0) {
    return -15;
  }

  return 0;
}

function hasSafetyVeto(day: ForecastDay): boolean {
  return (
    isSevereWeatherCode(day.weatherCode) ||
    (day.precipitationSumMillimeters ?? 0) > 20 ||
    (day.snowfallCentimeters ?? 0) > 5 ||
    (day.maxWindSpeedKmh ?? 0) >= 50 ||
    (day.maxWindGustKmh ?? 0) >= 70
  );
}

function isSevereWeatherCode(weatherCode: number | null): boolean {
  if (weatherCode === null) {
    return false;
  }

  return SEVERE_SURFING_WEATHER_CODES.includes(weatherCode);
}

enum SevereSurfingWeatherCode {
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

const SEVERE_SURFING_WEATHER_CODES = [
  SevereSurfingWeatherCode.FreezingDrizzleDense,
  SevereSurfingWeatherCode.RainHeavy,
  SevereSurfingWeatherCode.FreezingRainHeavy,
  SevereSurfingWeatherCode.SnowfallHeavy,
  SevereSurfingWeatherCode.RainShowersViolent,
  SevereSurfingWeatherCode.SnowShowersHeavy,
  SevereSurfingWeatherCode.Thunderstorm,
  SevereSurfingWeatherCode.ThunderstormWithSlightHail,
  SevereSurfingWeatherCode.ThunderstormWithHeavyHail,
] as const;
