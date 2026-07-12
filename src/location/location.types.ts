import { z } from 'zod';
import { normalizeLookup } from './location.normalize';

export const CountrySchema = z
  .object({
    code: z.string().regex(/^[A-Z]{2}$/),
    name: z.string().min(1),
  })
  .strict();

export type Country = z.infer<typeof CountrySchema>;

export const GeocoordinateSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .strict();

export type Geocoordinate = z.infer<typeof GeocoordinateSchema>;

export const LocationSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z]{2}$/),
    name: z.string().min(1),
    country: CountrySchema,
    geocoordinate: GeocoordinateSchema,
  })
  .strict();

export type Location = z.infer<typeof LocationSchema>;

const LookupTermSchema = (field: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `${field} is required` })
    .transform(normalizeLookup);

export const LocationQuerySchema = z
  .object({
    name: LookupTermSchema('name'),
    country: LookupTermSchema('country'),
  })
  .strict();

export type LocationQueryInput = z.input<typeof LocationQuerySchema>;
export type LocationQuery = z.infer<typeof LocationQuerySchema>;
