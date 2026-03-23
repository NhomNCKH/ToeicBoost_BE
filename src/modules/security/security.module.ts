import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import { AuthInputMiddleware } from './middlewares/auth-input.middleware';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { S3StorageModule } from '../s3/s3-storage.module';
import { Permission } from '../admin/rbac/entities/permission.entity';
import { Role } from '../admin/rbac/entities/role.entity';
import { RolePermission } from '../admin/rbac/entities/role-permission.entity';
import { UserRoleAssignment } from '../admin/rbac/entities/user-role.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      RefreshToken,
      Role,
      UserRoleAssignment,
      Permission,
      RolePermission,
    ]),
    S3StorageModule,
  ],
  controllers: [SecurityController],
  providers: [SecurityService, JwtStrategy],
  exports: [SecurityService],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthInputMiddleware)
      .forRoutes(
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/login', method: RequestMethod.POST },
      );
  }
}
