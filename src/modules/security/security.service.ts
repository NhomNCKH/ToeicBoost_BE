import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { extname } from 'node:path';
import type { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DataSource, Repository } from 'typeorm';
import { APP_CONSTANTS } from '../../common/constants/app.constant';
import { UserRole, UserStatus } from '../../common/constants/user.enum';
import {
  IJwtPayload,
  ITokenPair,
} from '../../common/interfaces/jwt-payload.interface';
import { HashHelper } from '../../helpers/hash.helper';
import { S3StorageService } from '../s3/s3-storage.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import { IAuthRequestMeta } from './interfaces/auth-request.interface';
import { Role } from '../admin/rbac/entities/role.entity';
import { UserRoleAssignment } from '../admin/rbac/entities/user-role.entity';

interface AccessContext {
  primaryRole: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class SecurityService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleRepository: Repository<UserRoleAssignment>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly s3StorageService: S3StorageService,
    private readonly dataSource: DataSource,
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

    const learnerRole = await this.getRoleByCode(UserRole.LEARNER);

    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await HashHelper.hash(dto.password),
    });

    const createdUser = await this.userRepository.save(user);

    await this.userRoleRepository.save(
      this.userRoleRepository.create({
        userId: createdUser.id,
        roleId: learnerRole.id,
      }),
    );

    return {
      success: true,
      message: 'Account created successfully',
      data: {
        user_id: createdUser.id,
      },
    };
  }

  async login(dto: LoginDto, meta: IAuthRequestMeta) {
    const user = await this.loadUserWithAccessContext({
      email: dto.email,
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(
        'Account temporarily locked. Please try again later.',
      );
    }

    this.assertLoginAllowedByStatus(user.status);

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

    const accessContext = this.buildAccessContext(user);
    const tokens = await this.generateTokenPair(user, accessContext, meta);

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: accessContext.primaryRole,
          roles: accessContext.roles,
          permissions: accessContext.permissions,
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

    // Dùng transaction + pessimistic write lock để tránh race condition
    // khi nhiều request đồng thời dùng cùng refresh token (PostgreSQL 23505)
    return this.dataSource.transaction(async (manager) => {
      const refreshToken = await manager.findOne(RefreshToken, {
        where: { tokenHash: hashedToken },
        lock: { mode: 'pessimistic_write' },
      });

      if (
        !refreshToken ||
        refreshToken.revokedAt ||
        refreshToken.expiresAt <= new Date()
      ) {
        throw new UnauthorizedException('Refresh token is expired or revoked');
      }

      const user = await this.loadUserWithAccessContext({ id: payload.sub });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      this.assertLoginAllowedByStatus(user.status);

      // Revoke token cũ trong cùng transaction
      refreshToken.revokedAt = new Date();
      await manager.save(refreshToken);

      const accessContext = this.buildAccessContext(user);
      const tokens = await this.generateTokenPair(user, accessContext, meta, manager);

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
      };
    });
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
    return this.userRepository
      .findOne({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          avatarUrl: true,
          phone: true,
          birthday: true,
          address: true,
          bio: true,
          linkedin: true,
          github: true,
          twitter: true,
        },
      })
      .then((user) => ({
        success: true,
        message: 'Current user profile',
        data: {
          ...payload,
          name: user?.name ?? payload.email,
          avatarUrl: user?.avatarUrl ?? null,
          phone: user?.phone ?? null,
          birthday: user?.birthday ?? null,
          address: user?.address ?? null,
          bio: user?.bio ?? null,
          linkedin: user?.linkedin ?? null,
          github: user?.github ?? null,
          twitter: user?.twitter ?? null,
        } as any,
      }));
  }

  async updateMe(userId: string, dto: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (typeof dto?.name === 'string') user.name = dto.name.trim();
    if (typeof dto?.phone === 'string') user.phone = dto.phone.trim() || null;
    if (typeof dto?.birthday === 'string') user.birthday = dto.birthday || null;
    if (typeof dto?.address === 'string') user.address = dto.address.trim() || null;
    if (typeof dto?.bio === 'string') user.bio = dto.bio.trim() || null;
    if (typeof dto?.linkedin === 'string') user.linkedin = dto.linkedin.trim() || null;
    if (typeof dto?.github === 'string') user.github = dto.github.trim() || null;
    if (typeof dto?.twitter === 'string') user.twitter = dto.twitter.trim() || null;

    const saved = await this.userRepository.save(user);
    return {
      success: true,
      message: 'Profile updated',
      data: {
        id: saved.id,
        email: saved.email,
        name: saved.name,
        status: saved.status,
        avatarUrl: saved.avatarUrl,
        phone: saved.phone,
        birthday: saved.birthday,
        address: saved.address,
        bio: saved.bio,
        linkedin: saved.linkedin,
        github: saved.github,
        twitter: saved.twitter,
      },
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Missing file');
    }

    const mimeType = String(file.mimetype ?? '');
    const originalName = String(file.originalname ?? '');

    if (!mimeType.startsWith('image/')) {
      throw new BadRequestException('Invalid file type. Expect image/*');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Empty file');
    }

    const extension =
      this.getExtensionFromMime(mimeType) ?? extname(originalName);

    if (!extension) {
      throw new BadRequestException('Cannot determine file extension');
    }

    const safeExt = extension.startsWith('.')
      ? extension.toLowerCase()
      : `.${extension.toLowerCase()}`;
    const objectKey = `avatars/${userId}/${uuidv4()}${safeExt}`;

    await this.s3StorageService.uploadObject({
      objectKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    const avatarUrl = this.s3StorageService.buildPublicUrl(objectKey);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.avatarUrl = avatarUrl;
    user.avatarS3Key = objectKey;
    await this.userRepository.save(user);

    return {
      avatarUrl,
      s3Key: objectKey,
    };
  }

  async getAvatar(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, avatarUrl: true, avatarS3Key: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { avatarUrl: user.avatarUrl, s3Key: user.avatarS3Key ?? null };
  }

  async attachAvatarFromS3Key(userId: string, s3Key: string) {
    if (!s3Key) {
      throw new BadRequestException('Missing s3Key');
    }

    const expectedPrefix = `avatars/${userId}/`;
    if (!s3Key.startsWith(expectedPrefix)) {
      throw new BadRequestException(
        'Invalid s3Key. It must be in avatars/<userId>/ folder.',
      );
    }

    const avatarUrl = this.s3StorageService.buildPublicUrl(s3Key);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.avatarUrl = avatarUrl;
    user.avatarS3Key = s3Key;
    await this.userRepository.save(user);

    return {
      avatarUrl,
      s3Key,
    };
  }

  private async loadUserWithAccessContext(
    where: Partial<Pick<User, 'id' | 'email'>>,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where,
      relations: {
        userRoles: {
          role: {
            rolePermissions: {
              permission: true,
            },
          },
        },
      },
    });
  }

  private buildAccessContext(user: User): AccessContext {
    const roleCodes = Array.from(
      new Set(
        (user.userRoles ?? [])
          .map((userRole) => userRole.role?.code)
          .filter((code): code is string => Boolean(code)),
      ),
    );

    const permissions = Array.from(
      new Set(
        (user.userRoles ?? []).flatMap((userRole) =>
          (userRole.role?.rolePermissions ?? [])
            .map((rolePermission) => rolePermission.permission?.code)
            .filter((code): code is string => Boolean(code)),
        ),
      ),
    );

    const normalizedRoles =
      roleCodes.length > 0 ? roleCodes : [UserRole.LEARNER];
    const primaryRole = this.selectPrimaryRole(normalizedRoles);

    return {
      primaryRole,
      roles: normalizedRoles,
      permissions,
    };
  }

  private selectPrimaryRole(roles: string[]): string {
    if (roles.includes(UserRole.SUPERADMIN)) return UserRole.SUPERADMIN;
    if (roles.includes(UserRole.ADMIN)) return UserRole.ADMIN;
    return UserRole.LEARNER;
  }

  private async getRoleByCode(code: UserRole): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { code } });
    if (!role) {
      throw new NotFoundException(`Role not found: ${code}`);
    }

    return role;
  }

  private async generateTokenPair(
    user: User,
    accessContext: AccessContext,
    meta: IAuthRequestMeta,
    manager?: import('typeorm').EntityManager,
  ): Promise<ITokenPair> {
    const repo = manager
      ? manager.getRepository(RefreshToken)
      : this.refreshTokenRepository;

    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      role: accessContext.primaryRole,
      roles: accessContext.roles,
      permissions: accessContext.permissions,
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

    // jti (JWT ID) unique đảm bảo hash không bao giờ trùng dù sign đồng thời
    const accessJti = randomBytes(16).toString('hex');
    const refreshJti = randomBytes(16).toString('hex');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, jti: accessJti },
        { secret: accessSecret, expiresIn: accessTtlSeconds },
      ),
      this.jwtService.signAsync(
        { ...payload, jti: refreshJti },
        { secret: refreshSecret, expiresIn: refreshTtlSeconds },
      ),
    ]);

    const refreshTokenEntity = repo.create({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    await repo.save(refreshTokenEntity);

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

  private getExtensionFromMime(mime: string): string | null {
    const normalized = mime.toLowerCase();
    if (normalized === 'image/jpeg') return '.jpg';
    if (normalized === 'image/png') return '.png';
    if (normalized === 'image/gif') return '.gif';
    if (normalized === 'image/webp') return '.webp';
    if (normalized === 'image/bmp') return '.bmp';
    if (normalized === 'image/svg+xml') return '.svg';
    return null;
  }

  private assertLoginAllowedByStatus(status: UserStatus) {
    if (status === UserStatus.PENDING_VERIFICATION) {
      throw new ForbiddenException('Account is pending verification');
    }

    if (status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account is suspended');
    }

    if (status === UserStatus.DELETED) {
      throw new ForbiddenException('Account is deleted');
    }
  }
}
