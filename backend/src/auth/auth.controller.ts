import { Controller, Get, UseGuards, Response, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.auth.guard';
import { UserResponse } from '@supabase/supabase-js';

@ApiTags('Authentication')
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get the currently authenticated user information'
  })
  @ApiResponse({
    status: 200,
    description: 'Current user information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                user_metadata: { type: 'object' },
                app_metadata: { type: 'object' }
              }
            }
          }
        },
        error: { type: 'object', nullable: true }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  getCurrentUser(): Promise<UserResponse> {
    return this.authService.supabase.auth.getUser()
  }

  @Get("login")
  @ApiOperation({
    summary: 'Sign in user',
    description: 'Sign in with hardcoded credentials and set HTTP-only cookie'
  })
  @ApiResponse({
    status: 200,
    description: 'User signed in successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User signed in successfully' }
      }
    },
    headers: {
      'Set-Cookie': {
        description: 'HTTP-only authentication cookie',
        schema: { type: 'string' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed - Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Invalid credentials' }
      }
    }
  })
  async getUserByEmail(@Response() res: any): Promise<any> {
    const { data, error } = await this.authService.supabase.auth.signInWithPassword({
      email: 'jonas@42heilbronn.de',
      password: 'changeme',
    })

    if (error) {
      console.error('Error signing in:', error);
      return null;
    }
    res.cookie('token', data.session.access_token, { httpOnly: true, secure: true, maxAge: 1000 * 60 * 60 * 24 * 30 });
    return res.json({ message: 'User signed in successfully' });
  }

  @Post("logout")
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Sign out user',
    description: 'Sign out the current user and clear authentication cookie'
  })
  @ApiResponse({
    status: 200,
    description: 'User signed out successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User signed out successfully' }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Error signing out',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Error signing out' }
      }
    }
  })
  async logout(@Response() res: any): Promise<any> {
    const { error } = await this.authService.supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      return res.status(500).json({ message: 'Error signing out' });
    }

    res.clearCookie('token');
    return res.json({ message: 'User signed out successfully' });
  }
}
