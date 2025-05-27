import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Base metadata classes
export class RawAppMetaDataView {
    @ApiProperty({
        description: 'Authentication provider',
        example: 'email'
    })
    provider: string;

    @ApiProperty({
        type: [String],
        description: 'Available authentication providers',
        example: ['email', 'google', 'github']
    })
    providers: string[];
}

export class RawUserMetaDataView {
    @ApiPropertyOptional({
        description: 'Email verification status',
        example: true
    })
    email_verified?: boolean;
}

// Public view - minimal information for public display
export class UserPublicView {
    @ApiProperty({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    id: string;

    @ApiProperty({
        description: 'User email (domain only for privacy)',
        example: '***@example.com'
    })
    email: string;

    @ApiProperty({
        description: 'Account creation date',
        example: '2023-01-01T00:00:00.000Z'
    })
    created_at: string;

    @ApiProperty({
        description: 'User role',
        example: 'user',
        enum: ['user', 'admin', 'super_admin']
    })
    role: string;

    @ApiProperty({
        description: 'Email verification status',
        example: true
    })
    is_verified: boolean;
}

// Authenticated user view - for logged-in users viewing their own profile
export class UserAuthenticatedView {
    @ApiProperty({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    id: string;

    @ApiProperty({
        description: 'User email',
        example: 'user@example.com'
    })
    email: string;

    @ApiProperty({
        description: 'User role',
        example: 'user',
        enum: ['user', 'admin', 'super_admin']
    })
    role: string;

    @ApiPropertyOptional({
        description: 'Email confirmation date',
        example: '2023-01-01T00:00:00.000Z'
    })
    email_confirmed_at: string | null;

    @ApiPropertyOptional({
        description: 'Last sign in date',
        example: '2023-01-02T10:30:00.000Z'
    })
    last_sign_in_at: string | null;

    @ApiPropertyOptional({
        description: 'Raw user metadata',
        example: { email_verified: true, preferred_language: 'en' }
    })
    raw_user_meta_data: RawUserMetaDataView | null;

    @ApiProperty({
        description: 'Account creation date',
        example: '2023-01-01T00:00:00.000Z'
    })
    created_at: string;

    @ApiProperty({
        description: 'Last update date',
        example: '2023-01-02T10:30:00.000Z'
    })
    updated_at: string;

    @ApiPropertyOptional({
        description: 'Phone number',
        example: '+1234567890'
    })
    phone: string | null;

    @ApiPropertyOptional({
        description: 'Phone confirmation date',
        example: '2023-01-01T12:00:00.000Z'
    })
    phone_confirmed_at: string | null;

    @ApiPropertyOptional({
        description: 'Confirmation date',
        example: '2023-01-01T00:00:00.000Z'
    })
    confirmed_at: string | null;

    @ApiProperty({
        description: 'SSO user status',
        example: false
    })
    is_sso_user: boolean;

    @ApiProperty({
        description: 'Anonymous user status',
        example: false
    })
    is_anonymous: boolean;
}

// Admin view - comprehensive administrative information
export class UserAdminView {
    @ApiProperty({
        description: 'Instance ID',
        example: '00000000-0000-0000-0000-000000000000'
    })
    instance_id: string;

    @ApiProperty({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    id: string;

    @ApiProperty({
        description: 'Audience',
        example: 'authenticated'
    })
    aud: string;

    @ApiProperty({
        description: 'User role',
        example: 'user',
        enum: ['user', 'admin', 'super_admin']
    })
    role: string;

    @ApiProperty({
        description: 'User email',
        example: 'user@example.com'
    })
    email: string;

    @ApiPropertyOptional({
        description: 'Email confirmation date',
        example: '2023-01-01T00:00:00.000Z'
    })
    email_confirmed_at: string | null;

    @ApiPropertyOptional({
        description: 'Invitation date',
        example: null
    })
    invited_at: string | null;

    @ApiPropertyOptional({
        description: 'Confirmation sent date',
        example: '2023-01-01T00:00:00.000Z'
    })
    confirmation_sent_at: string | null;

    @ApiPropertyOptional({
        description: 'Recovery sent date',
        example: null
    })
    recovery_sent_at: string | null;

    @ApiPropertyOptional({
        description: 'Email change sent date',
        example: null
    })
    email_change_sent_at: string | null;

    @ApiPropertyOptional({
        description: 'Last sign in date',
        example: '2023-01-02T10:30:00.000Z'
    })
    last_sign_in_at: string | null;

    @ApiPropertyOptional({
        description: 'Raw application metadata',
        example: { provider: 'email', providers: ['email'] }
    })
    raw_app_meta_data: RawAppMetaDataView | null;

    @ApiPropertyOptional({
        description: 'Raw user metadata',
        example: { email_verified: true, preferred_language: 'en' }
    })
    raw_user_meta_data: RawUserMetaDataView | null;

    @ApiPropertyOptional({
        description: 'Super admin status',
        example: false
    })
    is_super_admin: boolean | null;

    @ApiProperty({
        description: 'Account creation date',
        example: '2023-01-01T00:00:00.000Z'
    })
    created_at: string;

    @ApiProperty({
        description: 'Last update date',
        example: '2023-01-02T10:30:00.000Z'
    })
    updated_at: string;

    @ApiPropertyOptional({
        description: 'Phone number',
        example: '+1234567890'
    })
    phone: string | null;

    @ApiPropertyOptional({
        description: 'Phone confirmation date',
        example: '2023-01-01T12:00:00.000Z'
    })
    phone_confirmed_at: string | null;

    @ApiProperty({
        description: 'Phone change',
        example: ''
    })
    phone_change: string;

    @ApiPropertyOptional({
        description: 'Phone change sent date',
        example: null
    })
    phone_change_sent_at: string | null;

    @ApiPropertyOptional({
        description: 'Confirmation date',
        example: '2023-01-01T00:00:00.000Z'
    })
    confirmed_at: string | null;

    @ApiProperty({
        description: 'Email change confirmation status',
        example: 0
    })
    email_change_confirm_status: number;

    @ApiPropertyOptional({
        description: 'Banned until date',
        example: null
    })
    banned_until: string | null;

    @ApiPropertyOptional({
        description: 'Reauthentication sent date',
        example: null
    })
    reauthentication_sent_at: string | null;

    @ApiProperty({
        description: 'SSO user status',
        example: false
    })
    is_sso_user: boolean;

    @ApiPropertyOptional({
        description: 'Deletion date',
        example: null
    })
    deleted_at: string | null;

    @ApiProperty({
        description: 'Anonymous user status',
        example: false
    })
    is_anonymous: boolean;
} 