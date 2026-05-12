import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3StorageModule } from '@modules/s3/s3-storage.module';
import { CredentialTemplate } from './entities/credential-template.entity';
import { CredentialRequest } from './entities/credential-request.entity';
import { Credential } from './entities/credential.entity';
import { CredentialEvent } from './entities/credential-event.entity';
import { CredentialVerificationLog } from './entities/credential-verification-log.entity';
import { CredentialAssetService } from './services/credential-asset.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CredentialTemplate,
      CredentialRequest,
      Credential,
      CredentialEvent,
      CredentialVerificationLog,
    ]),
    S3StorageModule,
  ],
  providers: [CredentialAssetService],
  exports: [TypeOrmModule, CredentialAssetService],
})
export class AdminCredentialModule {}
