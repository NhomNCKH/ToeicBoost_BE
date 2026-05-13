import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { CredentialStatus } from '@common/constants/credential.enum';
import { Credential } from '@modules/admin/credential/entities/credential.entity';
import { CredentialVerificationLog } from '@modules/admin/credential/entities/credential-verification-log.entity';
import type { VerifyCredentialResponse } from './dto/verify-credential-response.dto';

interface VerifyContext {
  ip?: string | null;
  userAgent?: string | null;
}

const PROJECT_BRAND_NAME = 'TOEIC MASTER';

@Injectable()
export class CredentialVerifyService {
  private readonly logger = new Logger(CredentialVerifyService.name);

  constructor(
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
    @InjectRepository(CredentialVerificationLog)
    private readonly verificationLogRepository: Repository<CredentialVerificationLog>,
  ) {}

  async verifyByQrToken(
    qrToken: string,
    context: VerifyContext,
  ): Promise<VerifyCredentialResponse> {
    const now = new Date();

    if (!qrToken || typeof qrToken !== 'string' || qrToken.length < 8) {
      await this.logVerification({
        credentialId: null,
        now,
        isSuccess: false,
        errorCode: 'invalid_token',
        context,
        metadata: { qrToken },
      });
      return {
        authentic: false,
        message: 'Ma QR khong hop le',
        reason: 'invalid_token',
      };
    }

    const credential = await this.credentialRepository.findOne({
      where: { qrToken },
      relations: { user: true, credentialTemplate: true },
    });

    if (!credential) {
      await this.logVerification({
        credentialId: null,
        now,
        isSuccess: false,
        errorCode: 'not_found',
        context,
        metadata: { qrToken },
      });
      return {
        authentic: false,
        message: 'Khong tim thay chung chi voi ma QR nay',
        reason: 'not_found',
      };
    }

    const meta = (credential.metadata ?? {}) as Record<string, unknown>;
    const payload = (credential.credentialPayload ?? {}) as Record<
      string,
      unknown
    >;

    const storedPayloadHash =
      typeof meta.payloadHash === 'string' ? meta.payloadHash : null;
    const storedChainHash =
      typeof meta.chainHash === 'string' ? meta.chainHash : null;
    const storedPreviousChainHash =
      typeof meta.previousChainHash === 'string'
        ? (meta.previousChainHash as string)
        : null;
    const ipfsGatewayUrl =
      typeof meta.ipfsGatewayUrl === 'string'
        ? (meta.ipfsGatewayUrl as string)
        : null;
    const qrImageUrl =
      typeof meta.qrImageUrl === 'string' ? (meta.qrImageUrl as string) : null;

    if (credential.status === CredentialStatus.REVOKED) {
      await this.logVerification({
        credentialId: credential.id,
        now,
        isSuccess: false,
        errorCode: 'revoked',
        context,
      });
      return {
        authentic: false,
        message: 'Chung chi nay da bi thu hoi',
        reason: 'revoked',
        credential: this.buildCredentialView(
          credential,
          payload,
          storedPayloadHash,
          storedChainHash,
          storedPreviousChainHash,
          ipfsGatewayUrl,
          qrImageUrl,
          null,
        ),
      };
    }

    if (credential.expiresAt && credential.expiresAt < now) {
      await this.logVerification({
        credentialId: credential.id,
        now,
        isSuccess: false,
        errorCode: 'expired',
        context,
      });
      return {
        authentic: false,
        message: 'Chung chi nay da het hieu luc',
        reason: 'expired',
        credential: this.buildCredentialView(
          credential,
          payload,
          storedPayloadHash,
          storedChainHash,
          storedPreviousChainHash,
          ipfsGatewayUrl,
          qrImageUrl,
          null,
        ),
      };
    }

    const recomputedDbHash = this.computePayloadHash(payload);
    const dbHashMatch =
      !!storedPayloadHash && recomputedDbHash === storedPayloadHash;

    let onChainPayloadMatchesDb: boolean | null = null;
    if (ipfsGatewayUrl && storedPayloadHash) {
      try {
        const ipfsPayload = await this.fetchIpfsPayload(ipfsGatewayUrl);
        if (ipfsPayload) {
          const ipfsHash = this.computePayloadHash(ipfsPayload);
          onChainPayloadMatchesDb = ipfsHash === storedPayloadHash;
        } else {
          onChainPayloadMatchesDb = null;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to fetch IPFS payload from ${ipfsGatewayUrl}: ${
            (error as Error).message
          }`,
        );
        onChainPayloadMatchesDb = null;
      }
    }

    if (!dbHashMatch) {
      await this.logVerification({
        credentialId: credential.id,
        now,
        isSuccess: false,
        errorCode: 'payload_tampered',
        context,
        metadata: {
          storedPayloadHash,
          recomputedDbHash,
          onChainPayloadMatchesDb,
        },
      });
      return {
        authentic: false,
        message: 'Du lieu chung chi khong khop voi hash da ky. Kha nang bi sua doi.',
        reason: 'payload_tampered',
        credential: this.buildCredentialView(
          credential,
          payload,
          storedPayloadHash,
          storedChainHash,
          storedPreviousChainHash,
          ipfsGatewayUrl,
          qrImageUrl,
          onChainPayloadMatchesDb,
        ),
      };
    }

    if (onChainPayloadMatchesDb === false) {
      await this.logVerification({
        credentialId: credential.id,
        now,
        isSuccess: false,
        errorCode: 'ipfs_mismatch',
        context,
        metadata: { storedPayloadHash, onChainPayloadMatchesDb },
      });
      return {
        authentic: false,
        message:
          'Du lieu chung chi tren IPFS khong khop voi du lieu noi bo. Co dau hieu gia mao.',
        reason: 'ipfs_mismatch',
        credential: this.buildCredentialView(
          credential,
          payload,
          storedPayloadHash,
          storedChainHash,
          storedPreviousChainHash,
          ipfsGatewayUrl,
          qrImageUrl,
          onChainPayloadMatchesDb,
        ),
      };
    }

    await this.logVerification({
      credentialId: credential.id,
      now,
      isSuccess: true,
      errorCode: null,
      context,
      metadata: {
        storedPayloadHash,
        onChainPayloadMatchesDb,
      },
    });

    return {
      authentic: true,
      message: 'Chung chi hop le va da duoc xac thuc',
      credential: this.buildCredentialView(
        credential,
        payload,
        storedPayloadHash,
        storedChainHash,
        storedPreviousChainHash,
        ipfsGatewayUrl,
        qrImageUrl,
        onChainPayloadMatchesDb,
      ),
    };
  }

  private buildCredentialView(
    credential: Credential,
    payload: Record<string, unknown>,
    payloadHash: string | null,
    chainHash: string | null,
    previousChainHash: string | null,
    ipfsGatewayUrl: string | null,
    qrImageUrl: string | null,
    onChainPayloadMatchesDb: boolean | null,
  ): VerifyCredentialResponse['credential'] {
    const subject = (payload.credentialSubject ?? {}) as Record<string, unknown>;
    const examTemplate = (subject.examTemplate ?? {}) as Record<string, unknown>;
    const issuer = (payload.issuer ?? {}) as Record<string, unknown>;

    const score = this.toNumber(subject.score);
    const passThreshold = this.toNumber(subject.passThreshold);
    const listening =
      typeof subject.listeningScore === 'number'
        ? (subject.listeningScore as number)
        : null;
    const reading =
      typeof subject.readingScore === 'number'
        ? (subject.readingScore as number)
        : null;

    return {
      id: credential.id,
      serialNumber: credential.serialNumber,
      status: credential.status,
      issuedAt: credential.issuedAt.toISOString(),
      expiresAt: credential.expiresAt ? credential.expiresAt.toISOString() : null,
      revokedAt: credential.revokedAt ? credential.revokedAt.toISOString() : null,
      revocationReason: credential.revocationReason,
      issuer: {
        name: typeof issuer.name === 'string' ? issuer.name : PROJECT_BRAND_NAME,
        did: credential.issuerDid,
      },
      subject: {
        userId: credential.userId,
        did: credential.subjectDid,
        name:
          typeof subject.learnerName === 'string'
            ? (subject.learnerName as string)
            : credential.user?.name ?? '',
        email:
          typeof subject.learnerEmail === 'string'
            ? (subject.learnerEmail as string)
            : credential.user?.email ?? '',
      },
      score: {
        total: score,
        passThreshold,
        listening,
        reading,
        passed: score >= passThreshold,
      },
      exam: {
        attemptId:
          typeof subject.examAttemptId === 'string'
            ? (subject.examAttemptId as string)
            : '',
        templateId:
          typeof examTemplate.id === 'string'
            ? (examTemplate.id as string)
            : null,
        templateName:
          typeof examTemplate.name === 'string'
            ? (examTemplate.name as string)
            : null,
        templateCode:
          typeof examTemplate.code === 'string'
            ? (examTemplate.code as string)
            : null,
      },
      integrity: {
        mode: 'off_chain_hash_chain',
        hashAlgorithm: 'sha256',
        payloadHash: payloadHash ?? '',
        chainHash: chainHash ?? '',
        previousChainHash,
        onChainPayloadMatchesDb,
      },
      storage: {
        ipfsCid: credential.ipfsCid,
        ipfsGatewayUrl,
        storageUri: credential.storageUri,
      },
      qr: {
        token: credential.qrToken,
        url: credential.qrUrl,
        imageUrl: qrImageUrl,
      },
    };
  }

  private async fetchIpfsPayload(
    gatewayUrl: string,
  ): Promise<Record<string, unknown> | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(gatewayUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      if (!response.ok) {
        return null;
      }
      const json = (await response.json()) as Record<string, unknown>;
      return json && typeof json === 'object' ? json : null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private computePayloadHash(payload: Record<string, unknown>): string {
    return this.hashSha256(this.stableStringify(payload));
  }

  private hashSha256(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  private stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }
    const objectValue = value as Record<string, unknown>;
    const keys = Object.keys(objectValue).sort();
    const body = keys
      .map(
        (key) =>
          `${JSON.stringify(key)}:${this.stableStringify(objectValue[key])}`,
      )
      .join(',');
    return `{${body}}`;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private async logVerification(input: {
    credentialId: string | null;
    now: Date;
    isSuccess: boolean;
    errorCode: string | null;
    context: VerifyContext;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.verificationLogRepository.save(
        this.verificationLogRepository.create({
          credentialId: input.credentialId,
          verificationSource: 'public_verify',
          verifierIp: input.context.ip ?? null,
          userAgent: input.context.userAgent ?? null,
          isSuccess: input.isSuccess,
          errorCode: input.errorCode,
          checkedAt: input.now,
          metadata: input.metadata ?? {},
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to log credential verification: ${(error as Error).message}`,
      );
    }
  }
}
