import { Injectable } from '@nestjs/common';
import { type Maybe, just, none } from '@sweet-monads/maybe';
import { LOCATION_CATALOG } from './location.catalog';
import { normalizeLookup } from './location.normalize';
import type { Location, LocationQuery } from './location.types';

@Injectable()
export class LocationService {
  find(query: LocationQuery): Maybe<Location> {
    const name = normalizeRequired('name', query.name);
    const country = normalizeRequired('country', query.country);

    const location = LOCATION_CATALOG.find((candidate) => {
      if (normalizeLookup(candidate.name) !== name) {
        return false;
      }

      return (
        normalizeLookup(candidate.country.code) === country ||
        normalizeLookup(candidate.country.name) === country
      );
    });

    return location ? just(location) : none<Location>();
  }
}

function normalizeRequired(field: keyof LocationQuery, value: string): string {
  if (value.trim() === '') {
    throw new Error(`${field} is required`);
  }

  return normalizeLookup(value);
}
