import { type Maybe } from '@sweet-monads/maybe';
import { type Location } from '../location/location.types';
import { type RecommendationScore, type Scorer } from './scorer';

export class ScorerAggregation<T extends string> {
  constructor(private readonly scorerList: Set<Scorer<T>>) {}

  score(
    location: Location,
  ): Promise<Map<Temporal.PlainDate, Map<T, Maybe<RecommendationScore>>>> {
    void location;
    void this.scorerList;
    throw new Error('ScorerAggregation.score is not implemented');
  }
}
