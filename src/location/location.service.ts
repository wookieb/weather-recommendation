import { Injectable } from '@nestjs/common';
import { type Maybe, just, none } from '@sweet-monads/maybe';
import { Span } from 'nestjs-otel';
import { LOCATION_CATALOG } from './location.catalog';
import { normalizeLookup } from './location.normalize';
import {
  LocationQuerySchema,
  type Location,
  type LocationQueryInput,
} from './location.types';

@Injectable()
export class LocationService {
  @Span('location.find')
  find(query: LocationQueryInput): Maybe<Location> {
    const { name, country } = LocationQuerySchema.parse(query);

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
