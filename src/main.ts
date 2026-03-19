import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppLogger } from './common/logger/app.logger';

async function bootstrap() {
  const logger = new AppLogger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, { logger });

    const configService = app.get(ConfigService);
    const port = configService.getOrThrow<string>('APP_PORT');
    const apiPrefix = configService.getOrThrow<string>('API_PREFIX');
    const appName = configService.getOrThrow<string>('APP_NAME');
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

    logger.log(`🚀 Starting ${appName} in ${nodeEnv} mode`);
    logger.log(`📡 API Prefix: /${apiPrefix}`);
    logger.log(`🏥 Health endpoints: / and /health`);
    logger.log(`📚 Swagger docs: /${apiPrefix}/docs`);

    app.setGlobalPrefix(apiPrefix, {
      exclude: [
        { path: '', method: RequestMethod.GET },
        { path: 'health', method: RequestMethod.GET },
      ],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    app.use(compression());

    // Configure helmet with relaxed settings for development
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );

    // Enable CORS for all origins in development, specific origins in production
    app.enableCors({
      origin: true, // Allow all origins for now to fix CORS issues
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Always enable Swagger for API documentation
    const swaggerConfig = new DocumentBuilder()
      .setTitle(appName)
      .setDescription('TOEIC AI Learning Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & Profile')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
      },
    });

    await app.listen(Number(port));

    logger.log(`🎉 Application is running on: http://localhost:${port}`);
    logger.log(`🏥 Health check: http://localhost:${port}/`);
    logger.log(
      `📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs`,
    );
  } catch (error) {
    logger.error(
      '❌ Failed to start application:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

void bootstrap();
