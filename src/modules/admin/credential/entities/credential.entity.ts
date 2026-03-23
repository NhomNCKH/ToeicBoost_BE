import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';
import { CredentialStatus } from '@common/constants/credential.enum';
import { CredentialTemplate } from './credential-template.entity';
import { CredentialRequest } from './credential-request.entity';
import { CredentialEvent } from './credential-event.entity';
import { CredentialVerificationLog } from './credential-verification-log.entity';

@Entity('credentials')
export class Credential extends BaseEntity {
  @Index('uq_credentials_serial_number', { unique: true })
  @Column({ name: 'serial_number', type: 'varchar', length: 100 })
  serialNumber: string;

  @Index('uq_credentials_vc_id', { unique: true })
  @Column({ name: 'vc_id', type: 'varchar', length: 255 })
  vcId: string;

  @Index('idx_credentials_status')
  @Column({
    name: 'status',
    type: 'enum',
    enum: CredentialStatus,
    enumName: 'credential_status',
    default: CredentialStatus.ISSUED,
  })
  status: CredentialStatus;

  @Index('idx_credentials_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index('idx_credentials_template_id')
  @Column({ name: 'credential_template_id', type: 'uuid' })
  credentialTemplateId: string;

  @Index('uq_credentials_request_id', {
    unique: true,
    where: '"request_id" IS NOT NULL',
  })
  @Column({ name: 'request_id', type: 'uuid', nullable: true })
  requestId: string | null;

  @Column({ name: 'subject_did', type: 'varchar', length: 255, nullable: true })
  subjectDid: string | null;

  @Column({ name: 'issuer_did', type: 'varchar', length: 255, nullable: true })
  issuerDid: string | null;

  @Column({
    name: 'storage_uri',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  storageUri: string | null;

  @Column({ name: 'ipfs_cid', type: 'varchar', length: 255, nullable: true })
  ipfsCid: string | null;

  @Index('uq_credentials_qr_token', { unique: true })
  @Column({ name: 'qr_token', type: 'varchar', length: 255 })
  qrToken: string;

  @Column({ name: 'qr_url', type: 'varchar', length: 1000, nullable: true })
  qrUrl: string | null;

  @Column({ name: 'network', type: 'varchar', length: 100, nullable: true })
  network: string | null;

  @Column({
    name: 'contract_address',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  contractAddress: string | null;

  @Column({ name: 'token_id', type: 'varchar', length: 255, nullable: true })
  tokenId: string | null;

  @Column({ name: 'tx_hash', type: 'varchar', length: 255, nullable: true })
  txHash: string | null;

  @Column({ name: 'issued_at', type: 'timestamptz' })
  issuedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'revoked_by', type: 'uuid', nullable: true })
  revokedById: string | null;

  @Column({ name: 'revocation_reason', type: 'text', nullable: true })
  revocationReason: string | null;

  @Column({
    name: 'credential_payload',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  credentialPayload: Record<string, unknown>;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CredentialTemplate, (template) => template.credentials, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'credential_template_id' })
  credentialTemplate: CredentialTemplate;

  @OneToOne(() => CredentialRequest, (request) => request.credential, {
    nullable: true,
  })
  @JoinColumn({ name: 'request_id' })
  request: CredentialRequest | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'revoked_by' })
  revokedBy: User | null;

  @OneToMany(() => CredentialEvent, (event) => event.credential)
  events: CredentialEvent[];

  @OneToMany(
    () => CredentialVerificationLog,
    (verificationLog) => verificationLog.credential,
  )
  verificationLogs: CredentialVerificationLog[];
}
