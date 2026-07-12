import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { LocationModule } from './location.module';
import { LocationService } from './location.service';

describe('LocationModule', () => {
  it('is imported by AppModule and provides LocationService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(LocationService)).toBeInstanceOf(LocationService);
  });

  it('exports only LocationService', () => {
    expect(Reflect.getMetadata('exports', LocationModule)).toEqual([
      LocationService,
    ]);
  });
});
