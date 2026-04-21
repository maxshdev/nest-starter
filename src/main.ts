import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { runSeeds } from './database/seed';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const globalPrefix = process.env.API_GLOBAL_PREFIX ?? 'api';
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const frontendUrls =
    process.env.FRONTEND_URL?.split(',').map((s) => s.trim()) ?? [];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      try {
        const url = new URL(origin);
        const hostname = url.hostname.toLowerCase();
        const isLocalhost =
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname === '::1';
        const isLan = hostname.startsWith('192.168.');
        const isAllowed = frontendUrls.some((fu) => {
          try {
            return new URL(fu).origin === origin;
          } catch {
            return false;
          }
        });
        if (isLocalhost || isLan || isAllowed) return callback(null, true);
        logger.warn(`CORS blocked: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      } catch {
        return callback(new Error('Invalid origin'));
      }
    },
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('nest-starter API')
    .setDescription(
      'Backend REST API for nest-starter / next-starter. Auth (JWT + Google), Users, Roles, User Profiles.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Ingrese el token JWT sin el prefijo "Bearer "',
        in: 'header',
      },
      'jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  if (process.env.RUN_SEEDS === 'true') {
    const dbType = (process.env.DB_TYPE ?? 'mysql').toLowerCase();
    if (dbType !== 'mongodb') {
      try {
        const dataSource = app.get(DataSource);
        await runSeeds(dataSource);
      } catch (err) {
        logger.warn(`Seed skipped: ${(err as Error).message}`);
      }
    } else {
      logger.log('Seeds omitted for MongoDB (see docs/MONGO.md).');
    }
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Servidor listo en http://localhost:${port}/${globalPrefix}`);
  logger.log(`📘 Swagger en http://localhost:${port}/${globalPrefix}/docs`);
}

void bootstrap();
