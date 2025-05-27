import { Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';

export enum UserViewType {
    PUBLIC = 'public',
    AUTHENTICATED = 'authenticated',
    ADMIN = 'admin'
}

@Injectable()
export class UserViewService {

    /**
     * Transform a user entity to public view
     */
    transformToPublicView(user: User): any {
        return {
            id: user.id,
            email: this.maskEmail(user.email),
            role: user.role,
            is_verified: user.emailConfirmedAt !== null,
            created_at: user.createdAt?.toISOString()
        };
    }

    /**
     * Transform a user entity to authenticated view
     */
    transformToAuthenticatedView(user: User): any {
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            email_confirmed_at: user.emailConfirmedAt?.toISOString() || null,
            last_sign_in_at: user.lastSignInAt?.toISOString() || null,
            raw_user_meta_data: user.rawUserMetaData,
            created_at: user.createdAt?.toISOString(),
            updated_at: user.updatedAt?.toISOString(),
            phone: user.phone,
            phone_confirmed_at: user.phoneConfirmedAt?.toISOString() || null,
            confirmed_at: user.confirmedAt?.toISOString() || null,
            is_sso_user: user.isSsoUser,
            is_anonymous: user.isAnonymous
        };
    }

    /**
     * Transform a user entity to admin view
     */
    transformToAdminView(user: User): any {
        return {
            instance_id: user.instanceId,
            id: user.id,
            aud: user.aud,
            role: user.role,
            email: user.email,
            email_confirmed_at: user.emailConfirmedAt?.toISOString() || null,
            invited_at: user.invitedAt?.toISOString() || null,
            confirmation_sent_at: user.confirmationSentAt?.toISOString() || null,
            recovery_sent_at: user.recoverySentAt?.toISOString() || null,
            email_change_sent_at: user.emailChangeSentAt?.toISOString() || null,
            last_sign_in_at: user.lastSignInAt?.toISOString() || null,
            raw_app_meta_data: user.rawAppMetaData,
            raw_user_meta_data: user.rawUserMetaData,
            is_super_admin: user.isSuperAdmin,
            created_at: user.createdAt?.toISOString(),
            updated_at: user.updatedAt?.toISOString(),
            phone: user.phone,
            phone_confirmed_at: user.phoneConfirmedAt?.toISOString() || null,
            phone_change: user.phoneChange,
            phone_change_sent_at: user.phoneChangeSentAt?.toISOString() || null,
            confirmed_at: user.confirmedAt?.toISOString() || null,
            email_change_confirm_status: user.emailChangeConfirmStatus,
            banned_until: user.bannedUntil?.toISOString() || null,
            reauthentication_sent_at: user.reauthenticationSentAt?.toISOString() || null,
            is_sso_user: user.isSsoUser,
            deleted_at: user.deletedAt?.toISOString() || null,
            is_anonymous: user.isAnonymous
            // Note: Sensitive tokens are excluded for security
        };
    }

    /**
     * Transform a user entity to the appropriate view based on the view type
     */
    transformToView(user: User, viewType: UserViewType): any {
        switch (viewType) {
            case UserViewType.PUBLIC:
                return this.transformToPublicView(user);

            case UserViewType.AUTHENTICATED:
                return this.transformToAuthenticatedView(user);

            case UserViewType.ADMIN:
                return this.transformToAdminView(user);

            default:
                return this.transformToPublicView(user);
        }
    }

    /**
     * Transform an array of users to the appropriate view
     */
    transformArrayToView(users: User[], viewType: UserViewType): any[] {
        return users.map(user => this.transformToView(user, viewType));
    }

    /**
     * Determine view type based on user role and context
     */
    determineViewType(
        requestingUserRole: string,
        targetUserId: string,
        requestingUserId?: string
    ): UserViewType {
        // Admin can see admin view
        if (requestingUserRole === 'admin' || requestingUserRole === 'super_admin') {
            return UserViewType.ADMIN;
        }

        // User can see authenticated view of their own profile
        if (requestingUserId && requestingUserId === targetUserId) {
            return UserViewType.AUTHENTICATED;
        }

        // Default to public view
        return UserViewType.PUBLIC;
    }

    /**
     * Check if user can access admin view
     */
    canAccessAdminView(userRole: string): boolean {
        return userRole === 'admin' || userRole === 'super_admin';
    }

    /**
     * Check if user can access authenticated view of a specific user
     */
    canAccessAuthenticatedView(requestingUserId: string, targetUserId: string): boolean {
        return requestingUserId === targetUserId;
    }

    /**
     * Mask email for privacy (show only domain)
     */
    private maskEmail(email: string): string {
        const [, domain] = email.split('@');
        return `***@${domain}`;
    }
} 