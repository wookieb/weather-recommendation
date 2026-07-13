import { Injectable } from '@nestjs/common';
import { just, none, type Maybe } from '@sweet-monads/maybe';
import { Span } from 'nestjs-otel';
import {
  type Location,
  type LocationQueryInput,
} from '../location/location.types';
import { LocationService } from '../location/location.service';
import { ScorerAggregation } from '../scoring/scorer-aggregation';
import { type RecommendationScore } from '../scoring/scorer';

export type Activity =
  'skiing' | 'surfing' | 'outdoorSightseeing' | 'indoorSightseeing';

export type RecommendationDay = {
  date: Temporal.PlainDate;
  skiing: RecommendationScore | null;
  surfing: RecommendationScore | null;
  outdoorSightseeing: RecommendationScore | null;
  indoorSightseeing: RecommendationScore | null;
};

export type RecommendationAverage = {
  skiing: RecommendationScore | null;
  surfing: RecommendationScore | null;
  outdoorSightseeing: RecommendationScore | null;
  indoorSightseeing: RecommendationScore | null;
};

export type CombinedRecommendation = {
  location: Location;
  average: RecommendationAverage;
  days: RecommendationDay[];
};

@Injectable()
export class CombinedRecommendationService {
  constructor(
    private readonly locationService: LocationService,
    private readonly scorerAggregation: ScorerAggregation<Activity>,
  ) {}

  @Span('recommendation.combined.get')
  async get(query: LocationQueryInput): Promise<Maybe<CombinedRecommendation>> {
    const location = this.locationService.find(query);
    if (location.isNone()) {
      return none<CombinedRecommendation>();
    }

    const perDay = await this.scorerAggregation.score(location.value);
    const averages = this.scorerAggregation.computeAverages(perDay);

    return just({
      location: location.value,
      average: {
        skiing: maybeScore(averages.get('skiing')),
        surfing: maybeScore(averages.get('surfing')),
        outdoorSightseeing: maybeScore(averages.get('outdoorSightseeing')),
        indoorSightseeing: maybeScore(averages.get('indoorSightseeing')),
      },
      days: perDay
        .toArray()
        .map(([date, scores]) => ({
          date,
          skiing: maybeScore(scores.get('skiing')),
          surfing: maybeScore(scores.get('surfing')),
          outdoorSightseeing: maybeScore(scores.get('outdoorSightseeing')),
          indoorSightseeing: maybeScore(scores.get('indoorSightseeing')),
        }))
        .sort(({ date: leftDate }, { date: rightDate }) =>
          leftDate.toString().localeCompare(rightDate.toString()),
        ),
    });
  }
}

function maybeScore(
  score: Maybe<RecommendationScore> | undefined,
): RecommendationScore | null {
  if (!score || score.isNone()) {
    return null;
  }

  return score.value;
}
