import { Module } from '@nestjs/common';
import { ForecastModule } from './forecast/forecast.module';
import { LocationModule } from './location/location.module';
import { ScoringModule } from './scoring/scoring.module';
import { SurfConditionsModule } from './surf-conditions/surf-conditions.module';

@Module({
  imports: [
    LocationModule,
    ForecastModule,
    SurfConditionsModule,
    ScoringModule,
  ],
})
export class AppModule {}
