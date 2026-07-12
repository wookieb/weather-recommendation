import { Module } from '@nestjs/common';
import { ForecastModule } from './forecast/forecast.module';
import { LocationModule } from './location/location.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { ScoringModule } from './scoring/scoring.module';
import { SurfConditionsModule } from './surf-conditions/surf-conditions.module';

@Module({
  imports: [
    LocationModule,
    ForecastModule,
    SurfConditionsModule,
    ScoringModule,
    RecommendationModule,
  ],
})
export class AppModule {}
