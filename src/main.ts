import { NestFactory } from '@nestjs/core';
import { createYoga } from 'graphql-yoga';
import { AppModule } from './app.module';
import { shutdownOpenTelemetry, startOpenTelemetry } from './otel';
import { CombinedRecommendationService } from './recommendation/combined-recommendation.service';
import { createRecommendationSchema } from './recommendation/recommendation.schema';

async function bootstrap() {
  startOpenTelemetry();
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
  process.once('SIGINT', () => void shutdown(app));
  process.once('SIGTERM', () => void shutdown(app));
  await app.listen(process.env.PORT ?? 3000);
}

async function shutdown(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  await app.close();
  await shutdownOpenTelemetry();
  process.exit(0);
}

void bootstrap();
