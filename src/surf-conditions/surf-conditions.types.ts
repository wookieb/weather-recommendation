export type SurfConditionsMeasurement = number | null;

export interface SurfConditionsDay {
  maxWaveHeightMeters: SurfConditionsMeasurement;
  maxWavePeriodSeconds: SurfConditionsMeasurement;
  dominantWaveDirectionDegrees: SurfConditionsMeasurement;
  maxSwellWaveHeightMeters: SurfConditionsMeasurement;
  maxSwellWavePeriodSeconds: SurfConditionsMeasurement;
  dominantSwellWaveDirectionDegrees: SurfConditionsMeasurement;
  maxWindWaveHeightMeters: SurfConditionsMeasurement;
}

export type SurfConditions = Map<Temporal.PlainDate, SurfConditionsDay>;
