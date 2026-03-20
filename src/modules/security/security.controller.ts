import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import type { Express } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { IJwtPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  AuthErrorDto,
  LoginSuccessDto,
  LogoutSuccessDto,
  MeSuccessDto,
  RefreshSuccessDto,
  RegisterSuccessDto,
} from './dto/auth-swagger-response.dto';
import { AttachAvatarFromS3Dto } from './dto/attach-avatar-from-s3.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { IAuthRequestMeta } from './interfaces/auth-request.interface';
import { SecurityService } from './security.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Đăng ký tài khoản mới',
    description:
      'Tạo người dùng mới với email duy nhất. Hệ thống tự hash password bằng bcrypt trước khi lưu DB.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Tạo tài khoản thành công',
    type: RegisterSuccessDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
    type: AuthErrorDto,
  })
  register(@Body() dto: RegisterDto) {
    return this.securityService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng nhập bằng email/password',
    description:
      'Xác thực thông tin đăng nhập, khóa tạm thời khi nhập sai nhiều lần, trả về access token + refresh token.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: LoginSuccessDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Email or password is incorrect',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Account temporarily locked',
    type: AuthErrorDto,
  })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.securityService.login(dto, this.getRequestMeta(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Làm mới token',
    description:
      'Dùng refresh token hợp lệ để cấp access token mới và rotate refresh token cũ.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Làm mới token thành công',
    type: RefreshSuccessDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token không hợp lệ/hết hạn/đã thu hồi',
    type: AuthErrorDto,
  })
  refreshToken(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.securityService.refreshToken(dto, this.getRequestMeta(req));
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng xuất',
    description:
      'Thu hồi refresh token hiện tại để vô hiệu hóa phiên đăng nhập ở client.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất thành công',
    type: LogoutSuccessDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Refresh token không tồn tại',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Thiếu hoặc sai access token',
    type: AuthErrorDto,
  })
  logout(@Body() dto: RefreshTokenDto) {
    return this.securityService.logout(dto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy thông tin user hiện tại',
    description:
      'Trả về payload người dùng được giải mã từ access token (sub, email, role, iat, exp).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin người dùng thành công',
    type: MeSuccessDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Thiếu hoặc sai access token',
    type: AuthErrorDto,
  })
  me(@CurrentUser() user: IJwtPayload) {
    return this.securityService.getMe(user);
  }

  @Post('me/avatar')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload avatar lên S3',
    description:
      'Nhận file ảnh (multipart/form-data), upload lên S3 và lưu URL vào DB (users.avatar_url).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Upload thành công',
    schema: {
      type: 'object',
      properties: {
        avatarUrl: { type: 'string' },
        s3Key: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype?.startsWith('image/')) {
          cb(null, true);
          return;
        }
        cb(null, false);
      },
    }),
  )
  uploadAvatar(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.securityService.uploadAvatar(userId, file);
  }

  @Get('me/avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy avatar của user hiện tại',
    description: 'Trả về avatarUrl đã lưu trong DB.',
  })
  getAvatar(@CurrentUser('sub') userId: string) {
    return this.securityService.getAvatar(userId);
  }

  @Post('me/avatar/s3')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gắn avatar từ s3Key (dành cho luồng pre-signed PUT)',
    description:
      'FE PUT ảnh trực tiếp lên S3 bằng pre-signed PUT xong sẽ gọi endpoint này để backend update users.avatar_url.',
  })
  @ApiBody({ type: AttachAvatarFromS3Dto })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật avatar thành công',
  })
  attachAvatarFromS3(
    @CurrentUser('sub') userId: string,
    @Body() dto: AttachAvatarFromS3Dto,
  ) {
    return this.securityService.attachAvatarFromS3Key(userId, dto.s3Key);
  }

  private getRequestMeta(req: Request): IAuthRequestMeta {
    return {
      ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
      userAgent: req.get('user-agent') ?? null,
    };
  }
}
