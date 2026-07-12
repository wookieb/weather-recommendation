import { Module } from '@nestjs/common';
import { CacheableMemory } from 'cacheable';
import { Client } from 'undici';
import { OpenMeteoClient } from '../forecast/open-meteo.client';
import {
  SURF_CONDITIONS_CACHE_TTL,
  SurfConditionsHelper,
} from './surf-conditions.helper';

@Module({
  providers: [
    SurfConditionsHelper,
    {
      provide: OpenMeteoClient,
      useFactory: () =>
        new OpenMeteoClient(
          new Client('https://api.open-meteo.com'),
          new Client('https://marine-api.open-meteo.com'),
        ),
    },
    {
      provide: CacheableMemory,
      useFactory: () =>
        new CacheableMemory({
          ttl: SURF_CONDITIONS_CACHE_TTL,
          useClone: false,
        }),
    },
  ],
  exports: [SurfConditionsHelper],
})
export class SurfConditionsModule {}
