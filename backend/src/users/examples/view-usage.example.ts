/**
 * User View System Usage Examples
 * 
 * This file demonstrates how to use the different user view classes
 * to control what information is exposed based on user roles and permissions.
 */

import { UserViewService, UserViewType } from '../services/user-view-simple.service';
import { User } from '../../entities/user.entity';

// Example usage in a service or controller
export class UserViewExamples {
    constructor(private readonly userViewService: UserViewService) { }

    /**
     * Example 1: Public user listing (e.g., for a public directory)
     */
    async getPublicUserDirectory(users: User[]) {
        // Returns minimal information: id, masked email, role, verification status, created_at
        return this.userViewService.transformArrayToView(users, UserViewType.PUBLIC);

        // Result example:
        // {
        //   id: "123e4567-e89b-12d3-a456-426614174000",
        //   email: "***@example.com",
        //   role: "user",
        //   is_verified: true,
        //   created_at: "2023-01-01T00:00:00.000Z"
        // }
    }

    /**
     * Example 2: User's own profile (authenticated view)
     */
    async getUserOwnProfile(user: User) {
        // Returns personal information: email, phone, metadata, timestamps
        // Excludes sensitive tokens and admin fields
        return this.userViewService.transformToView(user, UserViewType.AUTHENTICATED);

        // Result example:
        // {
        //   id: "123e4567-e89b-12d3-a456-426614174000",
        //   email: "user@example.com",
        //   role: "user",
        //   email_confirmed_at: "2023-01-01T00:00:00.000Z",
        //   last_sign_in_at: "2023-01-02T10:30:00.000Z",
        //   phone: "+1234567890",
        //   created_at: "2023-01-01T00:00:00.000Z",
        //   updated_at: "2023-01-02T10:30:00.000Z",
        //   // ... other safe fields
        // }
    }

    /**
     * Example 3: Admin view for user management
     */
    async getAdminUserView(user: User) {
        // Returns comprehensive information for administration
        // Still excludes the most sensitive tokens for security
        return this.userViewService.transformToView(user, UserViewType.ADMIN);

        // Result example:
        // {
        //   instance_id: "00000000-0000-0000-0000-000000000000",
        //   id: "123e4567-e89b-12d3-a456-426614174000",
        //   email: "user@example.com",
        //   role: "user",
        //   is_super_admin: false,
        //   banned_until: null,
        //   deleted_at: null,
        //   // ... all administrative fields except sensitive tokens
        // }
    }

    /**
     * Example 4: Dynamic view based on permissions
     */
    async getUserWithPermissionCheck(
        user: User,
        requestingUserRole: string,
        requestingUserId: string,
        targetUserId: string
    ) {
        // Automatically determine the appropriate view level
        const viewType = this.userViewService.determineViewType(
            requestingUserRole,
            targetUserId,
            requestingUserId
        );

        return this.userViewService.transformToView(user, viewType);
    }

    /**
     * Example 5: Permission checking
     */
    checkUserPermissions(userRole: string, requestingUserId: string, targetUserId: string) {
        const canAccessAdmin = this.userViewService.canAccessAdminView(userRole);
        const canAccessProfile = this.userViewService.canAccessAuthenticatedView(requestingUserId, targetUserId);

        return {
            canAccessAdmin,
            canAccessProfile,
            recommendedView: canAccessAdmin ? 'admin' : canAccessProfile ? 'authenticated' : 'public'
        };
    }
}

/**
 * API Endpoint Examples:
 * 
 * GET /users                    -> Public view for all users
 * GET /users?view=admin         -> Admin view (if authorized)
 * GET /users/public             -> Explicit public view
 * GET /users/admin              -> Explicit admin view (requires admin role)
 * 
 * GET /users/:id                -> Dynamic view based on permissions
 * GET /users/:id?view=public    -> Force public view
 * GET /users/:id/public         -> Explicit public view
 * GET /users/:id/profile        -> Authenticated view (own profile or admin)
 * 
 * View Selection Logic:
 * - Admin users: Can access admin view of all users
 * - Regular users: Can access authenticated view of their own profile only
 * - All users: Can access public view of any user
 * - Fallback: Always defaults to public view if permissions are insufficient
 */

/**
 * Security Features:
 * 
 * 1. Field Exclusion: Sensitive fields are automatically excluded using @Exclude()
 * 2. Data Transformation: Dates are converted to ISO strings, emails can be masked
 * 3. Permission Validation: Views are validated against user permissions
 * 4. Graceful Fallback: Invalid permissions fall back to safer view levels
 * 5. Token Protection: Authentication tokens are never exposed in any view
 */ 