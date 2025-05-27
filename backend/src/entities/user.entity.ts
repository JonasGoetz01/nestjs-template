import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface RawAppMetaData {
  provider: string;
  providers: string[];
  [key: string]: any;
}

export interface RawUserMetaData {
  email_verified?: boolean;
  [key: string]: any;
}

@Entity('auth.users') // Supabase auth schema
export class User {
  @Column({ type: 'uuid', name: 'instance_id' })
  instanceId: string;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  aud: string;

  @Column({ type: 'varchar', length: 255 })
  role: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'encrypted_password' })
  encryptedPassword: string;

  @Column({ type: 'timestamptz', name: 'email_confirmed_at', nullable: true })
  emailConfirmedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'invited_at', nullable: true })
  invitedAt: Date | null;

  @Column({ type: 'varchar', length: 255, name: 'confirmation_token', default: '' })
  confirmationToken: string;

  @Column({ type: 'timestamptz', name: 'confirmation_sent_at', nullable: true })
  confirmationSentAt: Date | null;

  @Column({ type: 'varchar', length: 255, name: 'recovery_token', default: '' })
  recoveryToken: string;

  @Column({ type: 'timestamptz', name: 'recovery_sent_at', nullable: true })
  recoverySentAt: Date | null;

  @Column({ type: 'varchar', length: 255, name: 'email_change_token_new', default: '' })
  emailChangeTokenNew: string;

  @Column({ type: 'varchar', length: 255, name: 'email_change', default: '' })
  emailChange: string;

  @Column({ type: 'timestamptz', name: 'email_change_sent_at', nullable: true })
  emailChangeSentAt: Date | null;

  @Column({ type: 'timestamptz', name: 'last_sign_in_at', nullable: true })
  lastSignInAt: Date | null;

  @Column({ type: 'jsonb', name: 'raw_app_meta_data', nullable: true })
  rawAppMetaData: RawAppMetaData | null;

  @Column({ type: 'jsonb', name: 'raw_user_meta_data', nullable: true })
  rawUserMetaData: RawUserMetaData | null;

  @Column({ type: 'boolean', name: 'is_super_admin', nullable: true })
  isSuperAdmin: boolean | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone: string | null;

  @Column({ type: 'timestamptz', name: 'phone_confirmed_at', nullable: true })
  phoneConfirmedAt: Date | null;

  @Column({ type: 'varchar', length: 15, name: 'phone_change', default: '' })
  phoneChange: string;

  @Column({ type: 'varchar', length: 255, name: 'phone_change_token', default: '' })
  phoneChangeToken: string;

  @Column({ type: 'timestamptz', name: 'phone_change_sent_at', nullable: true })
  phoneChangeSentAt: Date | null;

  @Column({ type: 'timestamptz', name: 'confirmed_at', nullable: true })
  confirmedAt: Date | null;

  @Column({ type: 'varchar', length: 255, name: 'email_change_token_current', default: '' })
  emailChangeTokenCurrent: string;

  @Column({ type: 'smallint', name: 'email_change_confirm_status', default: 0 })
  emailChangeConfirmStatus: number;

  @Column({ type: 'timestamptz', name: 'banned_until', nullable: true })
  bannedUntil: Date | null;

  @Column({ type: 'varchar', length: 255, name: 'reauthentication_token', default: '' })
  reauthenticationToken: string;

  @Column({ type: 'timestamptz', name: 'reauthentication_sent_at', nullable: true })
  reauthenticationSentAt: Date | null;

  @Column({ type: 'boolean', name: 'is_sso_user', default: false })
  isSsoUser: boolean;

  @Column({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'boolean', name: 'is_anonymous', default: false })
  isAnonymous: boolean;
}
