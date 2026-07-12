import { Module } from '@nestjs/common';
import { ForecastModule } from '../forecast/forecast.module';
import { SurfConditionsModule } from '../surf-conditions/surf-conditions.module';
import { IndoorSightseeingScorer } from './indoor-sightseeing.scorer';
import { OutdoorSightseeingRecommendationScorer } from './outdoor-sightseeing-recommendation.scorer';
import { SkiingDayScorer } from './skiing-day.scorer';
import { SurfingScorer } from './surfing.scorer';

@Module({
  imports: [ForecastModule, SurfConditionsModule],
  providers: [
    IndoorSightseeingScorer,
    OutdoorSightseeingRecommendationScorer,
    SkiingDayScorer,
    SurfingScorer,
  ],
  exports: [
    IndoorSightseeingScorer,
    OutdoorSightseeingRecommendationScorer,
    SkiingDayScorer,
    SurfingScorer,
  ],
})
export class ScoringModule {}
