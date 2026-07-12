import { just, none, type Maybe } from '@sweet-monads/maybe';
import { describe, expect, it } from 'vitest';
import { type Location } from '../location/location.types';
import { PlainDateHashMapContext } from './plain-date-hash-map-context';
import { ScorerAggregation } from './scorer-aggregation';
import { type RecommendationScore, type Scorer } from './scorer';

const london: Location = {
  slug: 'london-gb',
  name: 'London',
  country: { code: 'GB', name: 'United Kingdom' },
  geocoordinate: { latitude: 51.50853, longitude: -0.12574 },
};

describe('ScorerAggregation.score', () => {
  it('combines each configured activity score by Forecast Day', async () => {
    const aggregation = new ScorerAggregation(
      new Set([
        scorer('skiing', [
          ['2026-07-12', just(80)],
          ['2026-07-13', none()],
        ]),
        scorer('surfing', [['2026-07-12', just(60)]]),
      ]),
    );

    const result = await aggregation.score(london);

    expect(scoreEntries(result)).toEqual([
      ['2026-07-12', { skiing: 80, surfing: 60 }],
      ['2026-07-13', { skiing: null }],
    ]);
  });
});

describe('ScorerAggregation.computeAverages', () => {
  it('averages only produced scores for each configured activity', () => {
    const aggregation = new ScorerAggregation(
      new Set([
        scorer('skiing', []),
        scorer('surfing', []),
        scorer('indoorSightseeing', []),
      ]),
    );

    const result = aggregation.computeAverages(
      perDayScores([
        [
          '2026-07-12',
          new Map([
            ['skiing', just(80)],
            ['surfing', none()],
          ]),
        ],
        ['2026-07-13', new Map([['skiing', just(81)]])],
      ]),
    );

    expect(averageEntries(result)).toEqual({
      skiing: 81,
      surfing: null,
      indoorSightseeing: null,
    });
  });
});

function scorer<T extends string>(
  name: T,
  scores: Array<[string, Maybe<RecommendationScore>]>,
): Scorer<T> {
  return {
    name,
    score: () =>
      Promise.resolve(
        scores.reduce(
          (result, [date, score]) =>
            result.set(Temporal.PlainDate.from(date), score),
          PlainDateHashMapContext.empty<
            Temporal.PlainDate,
            Maybe<RecommendationScore>
          >(),
        ),
      ),
  };
}

function scoreEntries<T extends string>(
  result: Awaited<ReturnType<ScorerAggregation<T>['score']>>,
): Array<[string, Partial<Record<T, RecommendationScore | null>>]> {
  return result
    .toArray()
    .map(([date, scores]) => {
      const activityScores = Object.fromEntries(
        [...scores.entries()].map(([activity, score]) => [
          activity,
          score.isJust() ? score.value : null,
        ]),
      ) as Partial<Record<T, RecommendationScore | null>>;

      return [date.toString(), activityScores] as [
        string,
        Partial<Record<T, RecommendationScore | null>>,
      ];
    })
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate));
}

function perDayScores<T extends string>(
  scores: Array<[string, Map<T, Maybe<RecommendationScore>>]>,
) {
  return scores.reduce(
    (result, [date, activityScores]) =>
      result.set(Temporal.PlainDate.from(date), activityScores),
    PlainDateHashMapContext.empty<
      Temporal.PlainDate,
      Map<T, Maybe<RecommendationScore>>
    >(),
  );
}

function averageEntries<T extends string>(
  result: ReturnType<ScorerAggregation<T>['computeAverages']>,
): Partial<Record<T, RecommendationScore | null>> {
  return Object.fromEntries(
    [...result.entries()].map(([activity, score]) => [
      activity,
      score.isJust() ? score.value : null,
    ]),
  ) as Partial<Record<T, RecommendationScore | null>>;
}
