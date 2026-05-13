import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '@common/decorators/public.decorator';
import { CredentialVerifyService } from './credential-verify.service';
import type { VerifyCredentialResponse } from './dto/verify-credential-response.dto';

@ApiTags('Credentials (Public)')
@Controller('credentials')
export class CredentialPublicController {
  constructor(
    private readonly credentialVerifyService: CredentialVerifyService,
  ) {}

  @Public()
  @Get('verify/:token')
  @ApiOperation({
    summary:
      'Xac thuc cong khai 1 chung chi TOEIC theo qrToken (khong can dang nhap)',
  })
  async verify(
    @Param('token') token: string,
    @Req() request: Request,
  ): Promise<VerifyCredentialResponse> {
    const ip = this.extractClientIp(request);
    const userAgent = request.headers['user-agent']?.toString() ?? null;

    return this.credentialVerifyService.verifyByQrToken(token, {
      ip,
      userAgent,
    });
  }

  private extractClientIp(request: Request): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0];
    }
    return request.ip ?? request.socket?.remoteAddress ?? null;
  }
}
