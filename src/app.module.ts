import { Module } from '@nestjs/common';
import { ForecastModule } from './forecast/forecast.module';
import { LocationModule } from './location/location.module';
import { SurfConditionsModule } from './surf-conditions/surf-conditions.module';

@Module({
  imports: [LocationModule, ForecastModule, SurfConditionsModule],
})
export class AppModule {}
