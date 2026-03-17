import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class SecurityService {
  async register(_dto: RegisterDto): Promise<void> {
    // TODO: implement register
  }

  async verifyEmail(_token: string): Promise<void> {
    // TODO: implement verifyEmail
  }

  async login(_dto: LoginDto): Promise<void> {
    // TODO: implement login
  }

  async refreshToken(_refreshToken: string): Promise<void> {
    // TODO: implement refreshToken
  }

  async logout(_userId: string): Promise<void> {
    // TODO: implement logout
  }

  async forgotPassword(_email: string): Promise<void> {
    // TODO: implement forgotPassword
  }

  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    // TODO: implement resetPassword
  }
}
