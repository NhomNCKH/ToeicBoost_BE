import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredentialTemplate } from './entities/credential-template.entity';
import { CredentialRequest } from './entities/credential-request.entity';
import { Credential } from './entities/credential.entity';
import { CredentialEvent } from './entities/credential-event.entity';
import { CredentialVerificationLog } from './entities/credential-verification-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CredentialTemplate,
      CredentialRequest,
      Credential,
      CredentialEvent,
      CredentialVerificationLog,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class AdminCredentialModule {}
