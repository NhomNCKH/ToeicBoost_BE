import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { DB_ENTITIES_PATH } from './config/database.config';
import { CustomTypeOrmLogger } from './common/logger/typeorm.logger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SecurityModule } from './modules/security/security.module';
import { AppController } from './app.controller';
import { S3StorageModule } from './modules/s3/s3-storage.module';
import { MediaModule } from '@modules/media/media.module';
import { AdminModule } from '@modules/admin/admin.module';
import { AssessmentModule } from '@modules/assessment/assessment.module';
import { RedisModule } from './redis/redis.module'; // ← Thêm
import { ProctoringModule } from './proctoring/proctoring.module'; // ← Thêm
import { FlashcardsModule } from '@modules/flashcards/flashcards.module';
import { VocabularyModule } from '@modules/vocabulary/vocabulary.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { AiTutorModule } from '@modules/ai-tutor/ai-tutor.module';
import { ShadowingModule } from '@modules/shadowing/shadowing.module';
import { DailyDictationModule } from '@modules/daily-dictation/daily-dictation.module';
import { TimiModule } from '@modules/ai/timi/timi.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.getOrThrow<string>('DB_HOST'),
        port: +config.getOrThrow('DB_PORT'),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_DATABASE'),
        synchronize: false,
        logging: config.get('DB_LOGGING') === 'true',
        logger:
          config.get('DB_LOGGING') === 'true'
            ? new CustomTypeOrmLogger()
            : undefined,
        maxQueryExecutionTime: 1000,
        ssl:
          config.get('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        entities: [DB_ENTITIES_PATH],
        autoLoadEntities: true,
        migrationsTableName: 'migrations',
      }),
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: +config.getOrThrow('THROTTLE_TTL') * 1000,
          limit: +config.getOrThrow('THROTTLE_LIMIT'),
        },
      ],
    }),

    S3StorageModule,
    SecurityModule,
    MediaModule,
    AdminModule,
    AssessmentModule,

    RedisModule,
    ProctoringModule,
    FlashcardsModule,

    VocabularyModule,

    NotificationModule,

    AiTutorModule,
    ShadowingModule,
    DailyDictationModule,
    TimiModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
