
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: string;

  @Column("varchar")
  instance_id: string;

  @Column("varchar")
  aud: string;

  @Column("varchar")
  role: string;

  @Column("varchar")
  email: string;

  @Column("varchar")
  encrypted_password: string;

  @Column({ type: "timestamp" })
  email_confirmed_at: Date;

  @Column({ type: "timestamp" })
  recovery_sent_at: Date;

  @Column("varchar")
  email_change_token_new: string;

  @Column("varchar")
  email_change: string;

  @Column({ type: "timestamp" })
  email_change_sent_at: Date;

  @Column({ type: "timestamp" })
  last_signed_in_at: Date;

  @Column("varchar")
  raw_app_meta_data: string;

  @Column("varchar")
  raw_user_meta_data: string;

  @Column()
  is_super_admin: Boolean;

  @Column({ type: "timestamp" })
  created_at: Date;

  @Column({ type: "timestamp" })
  upDated_at: Date;

  @Column("varchar")
  phone: string;

  @Column({ type: "timestamp" })
  phone_confirmed_at: Date;

  @Column("varchar")
  phone_change: string;

  @Column("varchar")
  phone_change_token: string;

  @Column({ type: "timestamp" })
  phone_change_sent_at: Date;

  @Column({ type: "timestamp" })
  confirmed_at: Date;

  @Column("varchar")
  email_change_token_current: string;

  @Column()
  email_change_confirm_status: number;

  @Column({ type: "timestamp" })
  banned_until: Date;

  @Column("varchar")
  reauthentication_token: string;

  @Column({ type: "timestamp" })
  reauthentication_sent_at: Date;

  @Column()
  is_sso_user: Boolean;

  @Column({ type: "timestamp" })
  deleted_at: Date;

  @Column()
  is_anonymous: Boolean;

  @Column("varchar")
  recovery_token: string;

  @Column("varchar")
  invited_at: string;

  @Column("varchar")
  confirmation_token: string;

  @Column("varchar")
  confirmation_sent_at: string;

  @Column("varchar")
  firstName: string;

  @Column("varchar")
  lastName: string;

  @Column({ default: true })
  isActive: boolean;
}
