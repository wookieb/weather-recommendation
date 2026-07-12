import { Module } from '@nestjs/common';
import { LocationModule } from '../location/location.module';
import { IndoorSightseeingScorer } from '../scoring/indoor-sightseeing.scorer';
import { OutdoorSightseeingRecommendationScorer } from '../scoring/outdoor-sightseeing-recommendation.scorer';
import { ScorerAggregation } from '../scoring/scorer-aggregation';
import { ScoringModule } from '../scoring/scoring.module';
import { SkiingDayScorer } from '../scoring/skiing-day.scorer';
import { SurfingScorer } from '../scoring/surfing.scorer';
import { type Activity } from './combined-recommendation.service';
import { CombinedRecommendationService } from './combined-recommendation.service';

@Module({
  imports: [LocationModule, ScoringModule],
  providers: [
    CombinedRecommendationService,
    {
      provide: ScorerAggregation,
      useFactory: (
        skiingDayScorer: SkiingDayScorer,
        surfingScorer: SurfingScorer,
        outdoorSightseeingScorer: OutdoorSightseeingRecommendationScorer,
        indoorSightseeingScorer: IndoorSightseeingScorer,
      ) =>
        new ScorerAggregation<Activity>(
          new Set([
            skiingDayScorer,
            surfingScorer,
            outdoorSightseeingScorer,
            indoorSightseeingScorer,
          ]),
        ),
      inject: [
        SkiingDayScorer,
        SurfingScorer,
        OutdoorSightseeingRecommendationScorer,
        IndoorSightseeingScorer,
      ],
    },
  ],
  exports: [CombinedRecommendationService],
})
export class RecommendationModule {}
