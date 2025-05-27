# User View System

This module implements a flexible view system for the User entity that allows different levels of data exposure based on user roles and permissions.

## Overview

The view system provides three distinct views of user data:

### 1. **Public View** (`UserViewType.PUBLIC`)
- **Purpose**: Minimal information for public display
- **Fields**: `id`, `email` (masked), `role`, `is_verified`, `created_at`
- **Access**: Available to all authenticated users
- **Use Cases**: User directories, search results, public profiles

### 2. **Authenticated View** (`UserViewType.AUTHENTICATED`)
- **Purpose**: Personal profile information
- **Fields**: Personal data including full email, phone, metadata, timestamps
- **Access**: Own profile only (or admin override)
- **Use Cases**: User account settings, profile management

### 3. **Admin View** (`UserViewType.ADMIN`)
- **Purpose**: Administrative information
- **Fields**: Comprehensive admin data, system metadata, moderation fields
- **Access**: Admin/super_admin roles only
- **Use Cases**: User management dashboards, administrative tools

## API Endpoints

### Flexible Endpoints
```
GET /users                    # Dynamic view based on role
GET /users?view=admin         # Request specific view (if authorized)
GET /users/public             # Explicit public view
GET /users/admin              # Admin-only endpoint

GET /users/:id                # Dynamic view based on permissions
GET /users/:id?view=public    # Force public view
GET /users/:id/public         # Explicit public view
GET /users/:id/profile        # Authenticated profile view
```

## Usage Examples

### In a Controller
```typescript
@Get('users')
async getUsers(@Query('view') viewType?: UserViewType, @Request() req?: any) {
  const users = await this.usersService.findAll();
  
  // Determine appropriate view based on user role
  const requestingUserRole = req?.user?.role || 'user';
  const finalViewType = viewType || (
    this.userViewService.canAccessAdminView(requestingUserRole) 
      ? UserViewType.ADMIN 
      : UserViewType.PUBLIC
  );

  return this.userViewService.transformArrayToView(users, finalViewType);
}
```

### In a Service
```typescript
// Transform single user
const publicUser = this.userViewService.transformToView(user, UserViewType.PUBLIC);

// Transform array of users
const publicUsers = this.userViewService.transformArrayToView(users, UserViewType.PUBLIC);

// Auto-determine view type
const viewType = this.userViewService.determineViewType(
  requestingUserRole,
  targetUserId,
  requestingUserId
);
```

## Permission Logic

### View Selection Rules
1. **Admin users**: Can access admin view of all users
2. **Regular users**: Can access authenticated view of their own profile only
3. **All users**: Can access public view of any user
4. **Fallback**: Always defaults to public view if permissions are insufficient

### Permission Checking
```typescript
// Check admin access
const canAccessAdmin = this.userViewService.canAccessAdminView(userRole);

// Check profile access
const canAccessProfile = this.userViewService.canAccessAuthenticatedView(
  requestingUserId, 
  targetUserId
);
```

## Security Features

1. **Field Exclusion**: Sensitive fields are automatically excluded
2. **Data Transformation**: Dates converted to ISO strings, emails masked in public view
3. **Permission Validation**: Views validated against user permissions
4. **Graceful Fallback**: Invalid permissions fall back to safer view levels
5. **Token Protection**: Authentication tokens never exposed in any view

## Response Examples

### Public View Response
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "***@example.com",
  "role": "user",
  "is_verified": true,
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

### Authenticated View Response
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "role": "user",
  "email_confirmed_at": "2023-01-01T00:00:00.000Z",
  "last_sign_in_at": "2023-01-02T10:30:00.000Z",
  "phone": "+1234567890",
  "created_at": "2023-01-01T00:00:00.000Z",
  "updated_at": "2023-01-02T10:30:00.000Z"
}
```

### Admin View Response
```json
{
  "instance_id": "00000000-0000-0000-0000-000000000000",
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "role": "user",
  "is_super_admin": false,
  "banned_until": null,
  "deleted_at": null,
  "raw_app_meta_data": { "provider": "email" },
  "raw_user_meta_data": { "email_verified": true }
}
```

## Implementation Details

### UserViewService Methods

- `transformToView(user, viewType)` - Transform single user to specified view
- `transformArrayToView(users, viewType)` - Transform array of users
- `determineViewType(role, targetId, requesterId)` - Auto-determine appropriate view
- `canAccessAdminView(role)` - Check admin permissions
- `canAccessAuthenticatedView(requesterId, targetId)` - Check profile permissions

### View Types Enum
```typescript
export enum UserViewType {
  PUBLIC = 'public',
  AUTHENTICATED = 'authenticated',
  ADMIN = 'admin'
}
```

This view system provides a secure, flexible way to control data exposure while maintaining clean, typed interfaces throughout your application. 