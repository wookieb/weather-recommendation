import { type Maybe } from '@sweet-monads/maybe';
import { type Location } from '../location/location.types';

export type RecommendationScore = number;

export interface Scorer<T extends string> {
  readonly name: T;
  score(
    location: Location,
  ): Promise<Map<Temporal.PlainDate, Maybe<RecommendationScore>>>;
}
