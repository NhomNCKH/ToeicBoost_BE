import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SecurityService } from './security.service';
import { Public } from '../../common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.securityService.register(dto);
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    return this.securityService.verifyEmail(token);
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.securityService.login(dto);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.securityService.refreshToken(refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req: { user: { sub: string } }) {
    return this.securityService.logout(req.user.sub);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.securityService.forgotPassword(email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.securityService.resetPassword(token, newPassword);
  }

  @Public()
  @Get('google')
  async google() {
    // TODO: redirect to Google OAuth
  }

  @Public()
  @Get('google/callback')
  async googleCallback(@Req() req: unknown) {
    // TODO: handle Google OAuth callback
  }
}
