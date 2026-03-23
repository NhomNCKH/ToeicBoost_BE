import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';
import { CredentialEventType } from '@common/constants/credential.enum';
import { Credential } from './credential.entity';
import { CredentialRequest } from './credential-request.entity';

@Entity('credential_events')
export class CredentialEvent extends BaseEntity {
  @Index('idx_credential_events_type')
  @Column({
    name: 'event_type',
    type: 'enum',
    enum: CredentialEventType,
    enumName: 'credential_event_type',
  })
  eventType: CredentialEventType;

  @Column({ name: 'credential_id', type: 'uuid', nullable: true })
  credentialId: string | null;

  @Column({ name: 'credential_request_id', type: 'uuid', nullable: true })
  credentialRequestId: string | null;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ name: 'note', type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'payload', type: 'jsonb', default: () => "'{}'::jsonb" })
  payload: Record<string, unknown>;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @ManyToOne(() => Credential, (credential) => credential.events, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'credential_id' })
  credential: Credential | null;

  @ManyToOne(() => CredentialRequest, (request) => request.events, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'credential_request_id' })
  request: CredentialRequest | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;
}
