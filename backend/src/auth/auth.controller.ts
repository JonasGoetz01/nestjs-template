import { Controller, Get, UseGuards, Response, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.auth.guard';
import { UserResponse } from '@supabase/supabase-js';

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getCurrentUser(): Promise<UserResponse>{
    return this.authService.supabase.auth.getUser()
  }

  @Get("login")
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
