import SchemaBuilder from '@pothos/core';
import { GraphQLLocalDate } from 'graphql-scalars';
import {
  type CombinedRecommendation,
  CombinedRecommendationService,
  type RecommendationAverage,
  type RecommendationDay,
} from './combined-recommendation.service';
import {
  type Country,
  type Geocoordinate,
  type Location,
} from '../location/location.types';

type SchemaTypes = {
  Scalars: {
    LocalDate: {
      Input: string;
      Output: string;
    };
  };
  Objects: {
    CombinedRecommendation: CombinedRecommendation;
    Country: Country;
    Geocoordinate: Geocoordinate;
    Location: Location;
    RecommendationAverage: RecommendationAverage;
    RecommendationDay: RecommendationDay;
  };
};

export function createRecommendationSchema(
  combinedRecommendationService: CombinedRecommendationService,
) {
  const builder = new SchemaBuilder<SchemaTypes>({});

  builder.addScalarType('LocalDate', GraphQLLocalDate, {});

  builder.objectType('Country', {
    fields: (t) => ({
      code: t.exposeString('code'),
      name: t.exposeString('name'),
    }),
  });

  builder.objectType('Geocoordinate', {
    fields: (t) => ({
      latitude: t.exposeFloat('latitude'),
      longitude: t.exposeFloat('longitude'),
    }),
  });

  builder.objectType('Location', {
    fields: (t) => ({
      slug: t.exposeString('slug'),
      name: t.exposeString('name'),
      country: t.expose('country', { type: 'Country' }),
      geocoordinate: t.expose('geocoordinate', { type: 'Geocoordinate' }),
    }),
  });

  builder.objectType('RecommendationDay', {
    fields: (t) => ({
      date: t.field({
        type: 'LocalDate',
        resolve: (day) => day.date.toString(),
      }),
      skiing: t.exposeInt('skiing', { nullable: true }),
      surfing: t.exposeInt('surfing', { nullable: true }),
      outdoorSightseeing: t.exposeInt('outdoorSightseeing', { nullable: true }),
      indoorSightseeing: t.exposeInt('indoorSightseeing', { nullable: true }),
    }),
  });

  builder.objectType('RecommendationAverage', {
    fields: (t) => ({
      skiing: t.exposeInt('skiing', { nullable: true }),
      surfing: t.exposeInt('surfing', { nullable: true }),
      outdoorSightseeing: t.exposeInt('outdoorSightseeing', { nullable: true }),
      indoorSightseeing: t.exposeInt('indoorSightseeing', { nullable: true }),
    }),
  });

  builder.objectType('CombinedRecommendation', {
    fields: (t) => ({
      location: t.expose('location', { type: 'Location' }),
      average: t.expose('average', { type: 'RecommendationAverage' }),
      days: t.expose('days', { type: ['RecommendationDay'] }),
    }),
  });

  builder.queryType({
    fields: (t) => ({
      combinedRecommendation: t.field({
        type: 'CombinedRecommendation',
        nullable: true,
        args: {
          name: t.arg.string({ required: true }),
          country: t.arg.string({ required: true }),
        },
        resolve: async (_root, args) => {
          const result = await combinedRecommendationService.get(args);

          return result.isJust() ? result.value : null;
        },
      }),
    }),
  });

  return builder.toSchema();
}
