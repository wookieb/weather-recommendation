import { describe, expect, it } from 'vitest';
import { LOCATION_CATALOG } from './location.catalog';

describe('LOCATION_CATALOG', () => {
  it('keeps representative coastal and mountain Locations for activity scoring', () => {
    const slugs = LOCATION_CATALOG.map((location) => location.slug);

    expect(slugs).toEqual(expect.arrayContaining(['biarritz-fr', 'zermatt-ch']));
  });
});
