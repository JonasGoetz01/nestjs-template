import { Controller, Get, UseGuards, Response } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { createClient } from '@supabase/supabase-js';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("users")
  @UseGuards(JwtAuthGuard)
  getAllUsers(): Promise<User[]>{
    return this.usersService.findAll();
  }

  @Get("users/login")
  async getUserByEmail(@Response() res: any): Promise<any> {
    // Import and initialize Supabase client
    const supabaseUrl = "http://kong:8000";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.auth.signInWithPassword({
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
}
