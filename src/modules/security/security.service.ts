import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { APP_CONSTANTS } from '../../common/constants/app.constant';
import {
  IJwtPayload,
  ITokenPair,
} from '../../common/interfaces/jwt-payload.interface';
import { HashHelper } from '../../helpers/hash.helper';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import { IAuthRequestMeta } from './interfaces/auth-request.interface';

@Injectable()
export class SecurityService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException({
        message: 'Email already registered',
        error_code: 'EMAIL_EXISTS',
      });
    }

    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await HashHelper.hash(dto.password),
    });

    const createdUser = await this.userRepository.save(user);

    return {
      success: true,
      message: 'Account created successfully',
      data: {
        user_id: createdUser.id,
      },
    };
  }

  async login(dto: LoginDto, meta: IAuthRequestMeta) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(
        'Account temporarily locked. Please try again later.',
      );
    }

    const isValidPassword = await HashHelper.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Email or password is incorrect');
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const tokens = await this.generateTokenPair(user, meta);

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        ...tokens,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto, meta: IAuthRequestMeta) {
    let payload: IJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<IJwtPayload>(
        dto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const hashedToken = this.hashToken(dto.refreshToken);
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash: hashedToken },
    });

    if (
      !refreshToken ||
      refreshToken.revokedAt ||
      refreshToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Refresh token is expired or revoked');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    refreshToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(refreshToken);

    const tokens = await this.generateTokenPair(user, meta);

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    };
  }

  async logout(dto: RefreshTokenDto) {
    const hashedToken = this.hashToken(dto.refreshToken);

    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { tokenHash: hashedToken },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Refresh token does not exist');
    }

    if (!tokenRecord.revokedAt) {
      tokenRecord.revokedAt = new Date();
      await this.refreshTokenRepository.save(tokenRecord);
    }

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  getMe(payload: IJwtPayload) {
    return {
      success: true,
      message: 'Current user profile',
      data: payload,
    };
  }

  private async handleFailedLogin(user: User) {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= APP_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(
        Date.now() + APP_CONSTANTS.LOGIN_LOCK_MINUTES * 60 * 1000,
      );
      user.failedLoginAttempts = 0;
    }

    await this.userRepository.save(user);
  }

  private async generateTokenPair(
    user: User,
    meta: IAuthRequestMeta,
  ): Promise<ITokenPair> {
    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessExpiresIn = this.configService.getOrThrow<string>(
      'JWT_ACCESS_EXPIRATION',
    );
    const refreshExpiresIn = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRATION',
    );
    const accessTtlSeconds = this.parseDuration(accessExpiresIn);
    const refreshTtlSeconds = this.parseDuration(refreshExpiresIn);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessTtlSeconds,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshTtlSeconds,
      }),
    ]);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTtlSeconds,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDuration(value: string): number {
    const normalized = value.trim().toLowerCase();
    const match = normalized.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new BadRequestException(`Unsupported duration format: ${value}`);
    }

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 60 * 60 * 24;
      default:
        throw new BadRequestException(`Unsupported duration unit: ${unit}`);
    }
  }
}
