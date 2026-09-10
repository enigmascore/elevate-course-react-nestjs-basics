import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { appConfig } from "./config/app.config";

async function bootstrap() {
  const config = appConfig();
  const app = await NestFactory.create(AppModule);

  // every route lives under /api ( REST conventions )
  app.setGlobalPrefix("api");

  // request bodies are validated by the DTOs' class-validator rules;
  // unknown properties are stripped, unexpected ones rejected
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.enableCors({ origin: config.frontendUrl });

  await app.listen(config.port);
  console.log(`Backend listening on http://localhost:${config.port}/api`);
}

bootstrap();
