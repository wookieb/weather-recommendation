import { NestFactory } from '@nestjs/core';
import { createYoga } from 'graphql-yoga';
import { AppModule } from './app.module';
import { CombinedRecommendationService } from './recommendation/combined-recommendation.service';
import { createRecommendationSchema } from './recommendation/recommendation.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    '/',
    createYoga({
      graphqlEndpoint: '/',
      schema: createRecommendationSchema(
        app.get(CombinedRecommendationService),
      ),
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
