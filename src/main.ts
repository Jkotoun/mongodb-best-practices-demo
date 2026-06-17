import 'dotenv/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MongooseValidationFilter } from './common/mongoose-validation.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Principle #3 — request validation is delegated entirely to the Mongoose
  // schema (the DTOs carry no class-validator rules). This filter turns schema
  // ValidationError / invalid-ObjectId errors into clean 400 responses;
  // otherwise they'd surface as generic 500s. The httpAdapter lets the filter
  // delegate non-schema errors to Nest's default handler.
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new MongooseValidationFilter(httpAdapter));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
