import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { Credential } from './credential.entity';

@Entity('credential_verification_logs')
export class CredentialVerificationLog extends BaseEntity {
  @Index('idx_credential_verification_logs_credential_id')
  @Column({ name: 'credential_id', type: 'uuid', nullable: true })
  credentialId: string | null;

  @Column({
    name: 'verification_source',
    type: 'varchar',
    length: 50,
    default: 'public_verify',
  })
  verificationSource: string;

  @Column({ name: 'verifier_ip', type: 'varchar', length: 100, nullable: true })
  verifierIp: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 1000, nullable: true })
  userAgent: string | null;

  @Column({ name: 'is_success', type: 'boolean', default: true })
  isSuccess: boolean;

  @Column({ name: 'error_code', type: 'varchar', length: 100, nullable: true })
  errorCode: string | null;

  @Column({ name: 'checked_at', type: 'timestamptz' })
  checkedAt: Date;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => Credential, (credential) => credential.verificationLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'credential_id' })
  credential: Credential | null;
}
