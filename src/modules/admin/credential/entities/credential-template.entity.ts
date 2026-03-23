import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';
import { CredentialTemplateStatus } from '@common/constants/credential.enum';
import { Credential } from './credential.entity';
import { CredentialRequest } from './credential-request.entity';

@Entity('credential_templates')
export class CredentialTemplate extends BaseEntity {
  @Index('uq_credential_templates_code', { unique: true })
  @Column({ name: 'code', type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Index('idx_credential_templates_status')
  @Column({
    name: 'status',
    type: 'enum',
    enum: CredentialTemplateStatus,
    enumName: 'credential_template_status',
    default: CredentialTemplateStatus.DRAFT,
  })
  status: CredentialTemplateStatus;

  @Column({ name: 'issuer_name', type: 'varchar', length: 255 })
  issuerName: string;

  @Column({ name: 'issuer_did', type: 'varchar', length: 255, nullable: true })
  issuerDid: string | null;

  @Column({ name: 'pass_score_threshold', type: 'int', nullable: true })
  passScoreThreshold: number | null;

  @Column({ name: 'validity_days', type: 'int', nullable: true })
  validityDays: number | null;

  @Column({
    name: 'artwork_storage_key',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  artworkStorageKey: string | null;

  @Column({
    name: 'artwork_public_url',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  artworkPublicUrl: string | null;

  @Column({
    name: 'template_payload',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  templatePayload: Record<string, unknown>;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedById: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;

  @OneToMany(() => CredentialRequest, (request) => request.credentialTemplate)
  requests: CredentialRequest[];

  @OneToMany(() => Credential, (credential) => credential.credentialTemplate)
  credentials: Credential[];
}
