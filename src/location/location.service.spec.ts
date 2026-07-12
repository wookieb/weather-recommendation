import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { LocationModule } from './location.module';
import { LocationService } from './location.service';

describe('LocationService.find', () => {
  async function createService(): Promise<LocationService> {
    const moduleRef = await Test.createTestingModule({
      imports: [LocationModule],
    }).compile();

    return moduleRef.get(LocationService);
  }

  it('finds a Location by normalized name and country name', async () => {
    const service = await createService();

    const result = service.find({ name: '  ZURICH  ', country: 'switzerland' });

    expect(result.isJust()).toBe(true);
    expect(result.value).toEqual({
      slug: 'zurich-ch',
      name: 'Zurich',
      country: { code: 'CH', name: 'Switzerland' },
      geocoordinate: { latitude: 47.36667, longitude: 8.55 },
    });
  });

  it('finds a Location by country code', async () => {
    const service = await createService();

    const result = service.find({ name: 'London', country: 'GB' });

    expect(result.isJust()).toBe(true);
    expect(result.value?.slug).toBe('london-gb');
  });

  it('returns None for unsupported nonblank lookups', async () => {
    const service = await createService();

    const result = service.find({ name: 'London', country: 'France' });

    expect(result.isNone()).toBe(true);
  });

  it('throws for blank lookup terms', async () => {
    const service = await createService();

    expect(() => service.find({ name: ' ', country: 'GB' })).toThrow(
      'name is required',
    );
    expect(() => service.find({ name: 'London', country: '\t' })).toThrow(
      'country is required',
    );
  });
});
