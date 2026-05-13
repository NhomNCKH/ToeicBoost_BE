import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Credential } from '../modules/admin/credential/entities/credential.entity';
import { CredentialAssetService } from '../modules/admin/credential/services/credential-asset.service';
import { buildCredentialVerifyUrl } from '../config/public-frontend-url';

async function bootstrap() {
  const dryRun = process.argv.includes('--dry-run');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const dataSource = app.get(DataSource);
    const credentialRepository = dataSource.getRepository(Credential);
    const credentialAssetService = app.get(CredentialAssetService);

    const targets = await credentialRepository
      .createQueryBuilder('credential')
      .where('credential.qrToken IS NOT NULL')
      .andWhere(
        `(credential.qrUrl IS NULL
          OR credential.qrUrl LIKE :localHttp
          OR credential.qrUrl LIKE :localHttps)`,
        {
          localHttp: 'http://localhost:3000/verify/credential/%',
          localHttps: 'https://localhost:3000/verify/credential/%',
        },
      )
      .orderBy('credential.issuedAt', 'DESC')
      .getMany();

    console.log(
      `Found ${targets.length} credential(s) that need verify URL repair.`,
    );

    let repaired = 0;
    let failed = 0;

    for (const credential of targets) {
      const nextVerifyUrl = buildCredentialVerifyUrl(credential.qrToken);
      console.log(
        `${dryRun ? '[DRY RUN] ' : ''}${credential.id} -> ${nextVerifyUrl}`,
      );

      if (dryRun) {
        continue;
      }

      try {
        const qrAsset = await credentialAssetService.generateAndUploadQrImage({
          credentialId: credential.id,
          qrToken: credential.qrToken,
          verifyUrl: nextVerifyUrl,
        });

        credential.qrUrl = nextVerifyUrl;
        credential.metadata = {
          ...(credential.metadata ?? {}),
          qrImageUrl: qrAsset.publicUrl,
          qrImageS3Key: qrAsset.s3Key,
          qrRepairReason: 'normalize_frontend_base_url',
          qrRepairedAt: new Date().toISOString(),
        };

        await credentialRepository.save(credential);
        repaired += 1;
      } catch (error) {
        failed += 1;
        console.error(
          `Failed to repair credential ${credential.id}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    console.log(
      dryRun
        ? `Dry run complete. ${targets.length} credential(s) would be updated.`
        : `Repair complete. Success: ${repaired}, failed: ${failed}.`,
    );
  } finally {
    await app.close();
  }
}

void bootstrap();
