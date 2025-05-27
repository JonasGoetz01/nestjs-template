import { Controller, Get, UseGuards, Param, NotFoundException, Query, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { User } from '../entities/user.entity';
import { UserViewService, UserViewType } from './services/user-view-simple.service';
import {
  UserPublicView,
  UserAuthenticatedView,
  UserAdminView
} from './dto/user-views.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userViewService: UserViewService
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a list of all users. View level depends on your role: public (default), authenticated (own profile), admin (full details)'
  })
  @ApiQuery({
    name: 'view',
    required: false,
    enum: UserViewType,
    description: 'View type: public, authenticated, or admin'
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully (public view)',
    type: [UserPublicView]
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully (authenticated view)',
    type: [UserAuthenticatedView]
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully (admin view)',
    type: [UserAdminView]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getAllUsers(
    @Query('view') viewType?: UserViewType,
    @Request() req?: any
  ): Promise<any[]> {
    const users = await this.usersService.findAll();

    // Determine view type based on user role if not specified
    const requestingUserRole = req?.user?.role || 'user';
    const finalViewType = viewType || (
      this.userViewService.canAccessAdminView(requestingUserRole)
        ? UserViewType.ADMIN
        : UserViewType.PUBLIC
    );

    // Validate permissions for requested view
    if (finalViewType === UserViewType.ADMIN && !this.userViewService.canAccessAdminView(requestingUserRole)) {
      // Fallback to public view if user doesn't have admin permissions
      return this.userViewService.transformArrayToView(users, UserViewType.PUBLIC) as any[];
    }

    return this.userViewService.transformArrayToView(users, finalViewType) as any[];
  }

  @Get('public')
  @ApiOperation({
    summary: 'Get all users (public view)',
    description: 'Retrieve a list of all users with minimal public information'
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully (public view)',
    type: [UserPublicView]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getAllUsersPublic(): Promise<any[]> {
    const users = await this.usersService.findAll();
    return this.userViewService.transformArrayToView(users, UserViewType.PUBLIC);
  }

  @Get('admin')
  @ApiOperation({
    summary: 'Get all users (admin view)',
    description: 'Retrieve a list of all users with full administrative details. Requires admin role.'
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully (admin view)',
    type: [UserAdminView]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getAllUsersAdmin(@Request() req: any): Promise<any[]> {
    const requestingUserRole = req?.user?.role || 'user';

    if (!this.userViewService.canAccessAdminView(requestingUserRole)) {
      throw new NotFoundException('Admin access required');
    }

    const users = await this.usersService.findAll();
    return this.userViewService.transformArrayToView(users, UserViewType.ADMIN);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID. View level depends on permissions: public (default), authenticated (own profile), admin (full details)'
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'User ID',
    schema: { type: 'string' }
  })
  @ApiQuery({
    name: 'view',
    required: false,
    enum: UserViewType,
    description: 'View type: public, authenticated, or admin'
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully (public view)',
    type: UserPublicView
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully (authenticated view)',
    type: UserAuthenticatedView
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully (admin view)',
    type: UserAdminView
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(
    @Param('id') id: string,
    @Query('view') viewType?: UserViewType,
    @Request() req?: any
  ): Promise<any> {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Determine view type based on permissions
    const requestingUserRole = req?.user?.role || 'user';
    const requestingUserId = req?.user?.id;

    const finalViewType = viewType || this.userViewService.determineViewType(
      requestingUserRole,
      id,
      requestingUserId
    );

    // Validate permissions for requested view
    if (finalViewType === UserViewType.ADMIN && !this.userViewService.canAccessAdminView(requestingUserRole)) {
      // Check if user can access authenticated view
      if (this.userViewService.canAccessAuthenticatedView(requestingUserId, id)) {
        return this.userViewService.transformToView(user, UserViewType.AUTHENTICATED);
      }
      // Fallback to public view
      return this.userViewService.transformToView(user, UserViewType.PUBLIC);
    }

    if (finalViewType === UserViewType.AUTHENTICATED && !this.userViewService.canAccessAuthenticatedView(requestingUserId, id)) {
      // Fallback to public view if user can't access authenticated view
      return this.userViewService.transformToView(user, UserViewType.PUBLIC);
    }

    return this.userViewService.transformToView(user, finalViewType);
  }

  @Get(':id/public')
  @ApiOperation({
    summary: 'Get user by ID (public view)',
    description: 'Retrieve a specific user with minimal public information'
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'User ID',
    schema: { type: 'string' }
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully (public view)',
    type: UserPublicView
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByIdPublic(@Param('id') id: string): Promise<any> {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.userViewService.transformToView(user, UserViewType.PUBLIC);
  }

  @Get(':id/profile')
  @ApiOperation({
    summary: 'Get user profile (authenticated view)',
    description: 'Retrieve user profile information. Only accessible for own profile or by admins.'
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'User ID',
    schema: { type: 'string' }
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserAuthenticatedView
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only access own profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<any> {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const requestingUserRole = req?.user?.role || 'user';
    const requestingUserId = req?.user?.id;

    // Check if user can access this profile
    if (!this.userViewService.canAccessAuthenticatedView(requestingUserId, id) &&
      !this.userViewService.canAccessAdminView(requestingUserRole)) {
      throw new NotFoundException('Access denied');
    }

    return this.userViewService.transformToView(user, UserViewType.AUTHENTICATED);
  }
}