export type ForecastMeasurement = number | null;

export interface ForecastDay {
  weatherCode: ForecastMeasurement;
  maxTemperatureCelsius: ForecastMeasurement;
  minTemperatureCelsius: ForecastMeasurement;
  precipitationSumMillimeters: ForecastMeasurement;
  precipitationProbabilityPercent: ForecastMeasurement;
  maxWindSpeedKmh: ForecastMeasurement;
  maxWindGustKmh: ForecastMeasurement;
  snowfallCentimeters: ForecastMeasurement;
  sunshineDurationHours: ForecastMeasurement;
}

export type Forecast = Map<Temporal.PlainDate, ForecastDay>;
