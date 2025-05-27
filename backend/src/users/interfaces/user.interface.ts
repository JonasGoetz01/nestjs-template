export interface RawAppMetaData {
    provider: string;
    providers: string[];
    [key: string]: any;
}

export interface RawUserMetaData {
    email_verified?: boolean;
    [key: string]: any;
}

export interface SupabaseUser {
    instance_id: string;
    id: string;
    aud: string;
    role: string;
    email: string;
    encrypted_password: string;
    email_confirmed_at: Date | null;
    invited_at: Date | null;
    confirmation_token: string;
    confirmation_sent_at: Date | null;
    recovery_token: string;
    recovery_sent_at: Date | null;
    email_change_token_new: string;
    email_change: string;
    email_change_sent_at: Date | null;
    last_sign_in_at: Date | null;
    raw_app_meta_data: RawAppMetaData | null;
    raw_user_meta_data: RawUserMetaData | null;
    is_super_admin: boolean | null;
    created_at: Date;
    updated_at: Date;
    phone: string | null;
    phone_confirmed_at: Date | null;
    phone_change: string;
    phone_change_token: string;
    phone_change_sent_at: Date | null;
    confirmed_at: Date | null;
    email_change_token_current: string;
    email_change_confirm_status: number;
    banned_until: Date | null;
    reauthentication_token: string;
    reauthentication_sent_at: Date | null;
    is_sso_user: boolean;
    deleted_at: Date | null;
    is_anonymous: boolean;
} 