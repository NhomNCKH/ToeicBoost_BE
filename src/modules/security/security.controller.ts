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
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Express, Request } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { IJwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AttachAvatarFromS3Dto } from './dto/attach-avatar-from-s3.dto';
import {
  AuthErrorDto,
  LoginSuccessDto,
  LogoutSuccessDto,
  MeSuccessDto,
  RefreshSuccessDto,
  RegisterSuccessDto,
} from './dto/auth-swagger-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { IAuthRequestMeta } from './interfaces/auth-request.interface';
import { SecurityService } from './security.service';

@ApiTags('Xác thực')
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
      'Tạo tài khoản học viên mới với email duy nhất. Mật khẩu sẽ được mã hóa trước khi lưu vào cơ sở dữ liệu.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Tạo tài khoản thành công',
    type: RegisterSuccessDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào không hợp lệ',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email đã tồn tại trong hệ thống',
    type: AuthErrorDto,
  })
  register(@Body() dto: RegisterDto) {
    return this.securityService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng nhập bằng email và mật khẩu',
    description:
      'Xác thực thông tin đăng nhập, kiểm tra trạng thái khóa tạm thời và trả về access token cùng refresh token.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: LoginSuccessDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào không hợp lệ',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Email hoặc mật khẩu không chính xác',
    type: AuthErrorDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Tài khoản đang bị khóa tạm thời',
    type: AuthErrorDto,
  })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.securityService.login(dto, this.getRequestMeta(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Làm mới bộ token',
    description:
      'Dùng refresh token hợp lệ để cấp access token mới và xoay vòng refresh token hiện tại.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Làm mới token thành công',
    type: RefreshSuccessDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token không hợp lệ, đã hết hạn hoặc đã bị thu hồi',
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
      'Thu hồi refresh token hiện tại để vô hiệu hóa phiên đăng nhập trên thiết bị của người dùng.',
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
    description: 'Thiếu access token hoặc access token không hợp lệ',
    type: AuthErrorDto,
  })
  logout(@Body() dto: RefreshTokenDto) {
    return this.securityService.logout(dto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy thông tin người dùng hiện tại',
    description:
      'Trả về thông tin người dùng được giải mã từ access token hiện tại.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin người dùng thành công',
    type: MeSuccessDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Thiếu access token hoặc access token không hợp lệ',
    type: AuthErrorDto,
  })
  me(@CurrentUser() user: IJwtPayload) {
    return this.securityService.getMe(user);
  }

  @Post('me/avatar')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tải avatar lên S3',
    description:
      'Nhận file ảnh dạng multipart/form-data, tải lên S3 và cập nhật đường dẫn avatar của người dùng trong cơ sở dữ liệu.',
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
    description: 'Tải avatar thành công',
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
      limits: { fileSize: 5 * 1024 * 1024 },
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
    summary: 'Lấy avatar của người dùng hiện tại',
    description:
      'Trả về `avatarUrl` đã lưu cho người dùng hiện tại trong cơ sở dữ liệu.',
  })
  getAvatar(@CurrentUser('sub') userId: string) {
    return this.securityService.getAvatar(userId);
  }

  @Post('me/avatar/s3')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gắn avatar từ s3Key đã tải lên trước',
    description:
      'Dùng cho luồng frontend tải ảnh trực tiếp lên S3 bằng pre-signed URL, sau đó gọi endpoint này để cập nhật avatar cho người dùng.',
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
