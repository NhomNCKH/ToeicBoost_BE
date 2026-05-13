import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credential } from '@modules/admin/credential/entities/credential.entity';
import { CredentialVerificationLog } from '@modules/admin/credential/entities/credential-verification-log.entity';
import { CredentialPublicController } from './credential-public.controller';
import { CredentialVerifyService } from './credential-verify.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Credential, CredentialVerificationLog]),
  ],
  controllers: [CredentialPublicController],
  providers: [CredentialVerifyService],
  exports: [CredentialVerifyService],
})
export class CredentialPublicModule {}
