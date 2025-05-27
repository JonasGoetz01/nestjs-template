import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RawAppMetaDataDto {
    @ApiProperty({ description: 'Authentication provider' })
    provider: string;

    @ApiProperty({
        type: [String],
        description: 'Available authentication providers'
    })
    providers: string[];
}

export class RawUserMetaDataDto {
    @ApiPropertyOptional({ description: 'Email verification status' })
    email_verified?: boolean;
}

export class UserResponseDto {
    @ApiProperty({ description: 'Instance ID' })
    instance_id: string;

    @ApiProperty({ description: 'User ID' })
    id: string;

    @ApiProperty({ description: 'Audience' })
    aud: string;

    @ApiProperty({ description: 'User role' })
    role: string;

    @ApiProperty({ description: 'User email' })
    email: string;

    @ApiProperty({ description: 'Encrypted password' })
    encrypted_password: string;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Email confirmation date'
    })
    email_confirmed_at: string | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Invitation date'
    })
    invited_at: string | null;

    @ApiProperty({ description: 'Confirmation token' })
    confirmation_token: string;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Confirmation sent date'
    })
    confirmation_sent_at: string | null;

    @ApiProperty({ description: 'Recovery token' })
    recovery_token: string;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Recovery sent date'
    })
    recovery_sent_at: string | null;

    @ApiProperty({ description: 'New email change token' })
    email_change_token_new: string;

    @ApiProperty({ description: 'Email change' })
    email_change: string;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Email change sent date'
    })
    email_change_sent_at: string | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Last sign in date'
    })
    last_sign_in_at: string | null;

    @ApiPropertyOptional({
        type: RawAppMetaDataDto,
        description: 'Raw application metadata'
    })
    raw_app_meta_data: RawAppMetaDataDto | null;

    @ApiPropertyOptional({
        type: RawUserMetaDataDto,
        description: 'Raw user metadata'
    })
    raw_user_meta_data: RawUserMetaDataDto | null;

    @ApiPropertyOptional({ description: 'Super admin status' })
    is_super_admin: boolean | null;

    @ApiProperty({
        type: 'string',
        format: 'date-time',
        description: 'Account creation date'
    })
    created_at: string;

    @ApiProperty({
        type: 'string',
        format: 'date-time',
        description: 'Last update date'
    })
    updated_at: string;

    @ApiPropertyOptional({ description: 'Phone number' })
    phone: string | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Phone confirmation date'
    })
    phone_confirmed_at: string | null;

    @ApiProperty({ description: 'Phone change' })
    phone_change: string;

    @ApiProperty({ description: 'Phone change token' })
    phone_change_token: string;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Phone change sent date'
    })
    phone_change_sent_at: string | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Confirmation date'
    })
    confirmed_at: string | null;

    @ApiProperty({ description: 'Current email change token' })
    email_change_token_current: string;

    @ApiProperty({ description: 'Email change confirmation status' })
    email_change_confirm_status: number;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Banned until date'
    })
    banned_until: string | null;

    @ApiProperty({ description: 'Reauthentication token' })
    reauthentication_token: string;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Reauthentication sent date'
    })
    reauthentication_sent_at: string | null;

    @ApiProperty({ description: 'SSO user status' })
    is_sso_user: boolean;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Deletion date'
    })
    deleted_at: string | null;

    @ApiProperty({ description: 'Anonymous user status' })
    is_anonymous: boolean;
} 