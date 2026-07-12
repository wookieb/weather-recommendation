import { z } from 'zod';
import { normalizeLookup } from './location.normalize';
import { LocationSchema, type Location } from './location.types';

const catalogSchema = z.array(LocationSchema).superRefine((locations, ctx) => {
  const slugs = new Set<string>();
  const lookupKeys = new Set<string>();

  locations.forEach((location, index) => {
    if (slugs.has(location.slug)) {
      ctx.addIssue({
        code: 'custom',
        message: `Duplicate location slug: ${location.slug}`,
        path: [index, 'slug'],
      });
    }

    slugs.add(location.slug);

    const nameLookup = normalizeLookup(location.name);
    const locationLookupKeys = [
      `${nameLookup}:${normalizeLookup(location.country.code)}`,
      `${nameLookup}:${normalizeLookup(location.country.name)}`,
    ];
    const duplicateLookupKey = locationLookupKeys.find((lookupKey) =>
      lookupKeys.has(lookupKey),
    );

    if (duplicateLookupKey) {
      ctx.addIssue({
        code: 'custom',
        message: `Duplicate location lookup: ${location.name}, ${location.country.code}`,
        path: [index],
      });
    }

    locationLookupKeys.forEach((lookupKey) => lookupKeys.add(lookupKey));
  });
});

// Source: Open-Meteo Geocoding API v1 `/search`, queried once for each checked-in city.
export const LOCATION_CATALOG: readonly Location[] = catalogSchema.parse([
  {
    slug: 'london-gb',
    name: 'London',
    country: { code: 'GB', name: 'United Kingdom' },
    geocoordinate: { latitude: 51.50853, longitude: -0.12574 },
  },
  {
    slug: 'paris-fr',
    name: 'Paris',
    country: { code: 'FR', name: 'France' },
    geocoordinate: { latitude: 48.85341, longitude: 2.3488 },
  },
  {
    slug: 'biarritz-fr',
    name: 'Biarritz',
    country: { code: 'FR', name: 'France' },
    geocoordinate: { latitude: 43.48055, longitude: -1.55684 },
  },
  {
    slug: 'berlin-de',
    name: 'Berlin',
    country: { code: 'DE', name: 'Germany' },
    geocoordinate: { latitude: 52.52437, longitude: 13.41053 },
  },
  {
    slug: 'madrid-es',
    name: 'Madrid',
    country: { code: 'ES', name: 'Spain' },
    geocoordinate: { latitude: 40.4165, longitude: -3.70256 },
  },
  {
    slug: 'rome-it',
    name: 'Rome',
    country: { code: 'IT', name: 'Italy' },
    geocoordinate: { latitude: 41.89193, longitude: 12.51133 },
  },
  {
    slug: 'oslo-no',
    name: 'Oslo',
    country: { code: 'NO', name: 'Norway' },
    geocoordinate: { latitude: 59.91273, longitude: 10.74609 },
  },
  {
    slug: 'reykjavik-is',
    name: 'Reykjavik',
    country: { code: 'IS', name: 'Iceland' },
    geocoordinate: { latitude: 64.13548, longitude: -21.89541 },
  },
  {
    slug: 'zurich-ch',
    name: 'Zurich',
    country: { code: 'CH', name: 'Switzerland' },
    geocoordinate: { latitude: 47.36667, longitude: 8.55 },
  },
  {
    slug: 'zermatt-ch',
    name: 'Zermatt',
    country: { code: 'CH', name: 'Switzerland' },
    geocoordinate: { latitude: 46.01998, longitude: 7.74863 },
  },
  {
    slug: 'tokyo-jp',
    name: 'Tokyo',
    country: { code: 'JP', name: 'Japan' },
    geocoordinate: { latitude: 35.6895, longitude: 139.69171 },
  },
  {
    slug: 'sydney-au',
    name: 'Sydney',
    country: { code: 'AU', name: 'Australia' },
    geocoordinate: { latitude: -33.86785, longitude: 151.20732 },
  },
  {
    slug: 'auckland-nz',
    name: 'Auckland',
    country: { code: 'NZ', name: 'New Zealand' },
    geocoordinate: { latitude: -36.84853, longitude: 174.76349 },
  },
  {
    slug: 'new-york-us',
    name: 'New York',
    country: { code: 'US', name: 'United States' },
    geocoordinate: { latitude: 40.71427, longitude: -74.00597 },
  },
  {
    slug: 'vancouver-ca',
    name: 'Vancouver',
    country: { code: 'CA', name: 'Canada' },
    geocoordinate: { latitude: 49.24966, longitude: -123.11934 },
  },
  {
    slug: 'rio-de-janeiro-br',
    name: 'Rio de Janeiro',
    country: { code: 'BR', name: 'Brazil' },
    geocoordinate: { latitude: -22.90642, longitude: -43.18223 },
  },
  {
    slug: 'cape-town-za',
    name: 'Cape Town',
    country: { code: 'ZA', name: 'South Africa' },
    geocoordinate: { latitude: -33.92584, longitude: 18.42322 },
  },
  {
    slug: 'dubai-ae',
    name: 'Dubai',
    country: { code: 'AE', name: 'United Arab Emirates' },
    geocoordinate: { latitude: 25.07725, longitude: 55.30927 },
  },
  {
    slug: 'singapore-sg',
    name: 'Singapore',
    country: { code: 'SG', name: 'Singapore' },
    geocoordinate: { latitude: 1.28967, longitude: 103.85007 },
  },
  {
    slug: 'bangkok-th',
    name: 'Bangkok',
    country: { code: 'TH', name: 'Thailand' },
    geocoordinate: { latitude: 13.75398, longitude: 100.50144 },
  },
  {
    slug: 'buenos-aires-ar',
    name: 'Buenos Aires',
    country: { code: 'AR', name: 'Argentina' },
    geocoordinate: { latitude: -34.61315, longitude: -58.37723 },
  },
  {
    slug: 'santiago-cl',
    name: 'Santiago',
    country: { code: 'CL', name: 'Chile' },
    geocoordinate: { latitude: -33.45694, longitude: -70.64827 },
  },
] satisfies Location[]);
