import { Controller, Get, UseGuards, Param, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a list of all users from the authentication system'
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'User ID' },
          email: { type: 'string', description: 'User email' },
          created_at: { type: 'string', format: 'date-time', description: 'Account creation date' },
          updated_at: { type: 'string', format: 'date-time', description: 'Last update date' },
          user_metadata: { type: 'object', description: 'User metadata' },
          app_metadata: { type: 'object', description: 'Application metadata' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getAllUsers(): Promise<any[]> {
    return await this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID'
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'User ID',
    schema: { type: 'string' }
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'User ID' },
        email: { type: 'string', description: 'User email' },
        created_at: { type: 'string', format: 'date-time', description: 'Account creation date' },
        updated_at: { type: 'string', format: 'date-time', description: 'Last update date' },
        user_metadata: { type: 'object', description: 'User metadata' },
        app_metadata: { type: 'object', description: 'Application metadata' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string): Promise<any> {
    const user = await this.usersService.findOne(id).catch(error => {
      throw new NotFoundException(`User with ID ${id} not found`);
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}