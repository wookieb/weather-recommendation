import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { SurfingScorer } from './surfing.scorer';

describe('ScoringModule', () => {
  it('makes SurfingScorer available to application code', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(SurfingScorer)).toBeInstanceOf(SurfingScorer);

    await moduleRef.close();
  });
});
