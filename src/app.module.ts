import { Module } from '@nestjs/common';
import { ForecastModule } from './forecast/forecast.module';
import { LocationModule } from './location/location.module';

@Module({
  imports: [LocationModule, ForecastModule],
})
export class AppModule {}
