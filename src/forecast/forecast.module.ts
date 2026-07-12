import { Module } from '@nestjs/common';
import { CacheableMemory } from 'cacheable';
import { Client } from 'undici';
import { OpenMeteoClient } from './open-meteo.client';
import { FORECAST_CACHE_TTL, ForecastHelper } from './forecast.helper';

@Module({
  providers: [
    ForecastHelper,
    {
      provide: OpenMeteoClient,
      useFactory: () =>
        new OpenMeteoClient(new Client('https://api.open-meteo.com')),
    },
    {
      provide: CacheableMemory,
      useFactory: () =>
        new CacheableMemory({ ttl: FORECAST_CACHE_TTL, useClone: false }),
    },
  ],
  exports: [ForecastHelper],
})
export class ForecastModule {}
