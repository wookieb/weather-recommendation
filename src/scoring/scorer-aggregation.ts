import { type HashMap } from '@rimbu/hashed';
import { just, none, type Maybe } from '@sweet-monads/maybe';
import { Span } from 'nestjs-otel';
import { type Location } from '../location/location.types';
import { PlainDateHashMapContext } from './plain-date-hash-map-context';
import { type RecommendationScore, type Scorer } from './scorer';

export class ScorerAggregation<T extends string> {
  constructor(private readonly scorerList: Set<Scorer<T>>) {}

  @Span('scoring.aggregate')
  async score(
    location: Location,
  ): Promise<HashMap<Temporal.PlainDate, Map<T, Maybe<RecommendationScore>>>> {
    const scoreEntries = await Promise.all(
      [...this.scorerList].map(async (scorer) => ({
        scorer,
        scores: await scorer.score(location),
      })),
    );

    let result = PlainDateHashMapContext.empty<
      Temporal.PlainDate,
      Map<T, Maybe<RecommendationScore>>
    >();

    for (const { scorer, scores } of scoreEntries) {
      for (const [date, score] of scores) {
        const activityScores = new Map(result.get(date) ?? []);
        activityScores.set(scorer.name, score);
        result = result.set(date, activityScores);
      }
    }

    return result;
  }

  @Span('scoring.compute_averages')
  computeAverages(
    perDay: HashMap<Temporal.PlainDate, Map<T, Maybe<RecommendationScore>>>,
  ): Map<T, Maybe<RecommendationScore>> {
    const producedScoresByActivity = new Map<T, RecommendationScore[]>();

    for (const scorer of this.scorerList) {
      producedScoresByActivity.set(scorer.name, []);
    }

    for (const [, activityScores] of perDay) {
      for (const [activity, score] of activityScores) {
        if (score.isJust() && producedScoresByActivity.has(activity)) {
          producedScoresByActivity.get(activity)?.push(score.value);
        }
      }
    }

    return new Map(
      [...producedScoresByActivity.entries()].map(([activity, scores]) => [
        activity,
        scores.length === 0
          ? none<RecommendationScore>()
          : just(
              Math.round(
                scores.reduce((sum, score) => sum + score, 0) / scores.length,
              ),
            ),
      ]),
    );
  }
}
