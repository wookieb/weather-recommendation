import { Module } from '@nestjs/common';
import { ForecastModule } from '../forecast/forecast.module';
import { SkiingDayScorer } from './skiing-day.scorer';

@Module({
  imports: [ForecastModule],
  providers: [SkiingDayScorer],
  exports: [SkiingDayScorer],
})
export class ScoringModule {}
