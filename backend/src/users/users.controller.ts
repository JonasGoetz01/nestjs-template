import { Controller, Get, UseGuards, Response, Param, ParseIntPipe, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { ApiParam } from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly authService: AuthService) { }

  @Get("users")
  @UseGuards(JwtAuthGuard)
  async getAllUsers(): Promise<any> {
    return await this.usersService.dataSource.query(`SELECT * FROM auth.users`)
  }

  @Get("users/:id")
  @ApiParam({ name: 'id', required: true, description: 'ID of the user', schema: { type: 'string' } })
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id') id: string, @Response() res: any): Promise<any> {
    (await this.usersService.dataSource.query(`SELECT * FROM auth.users WHERE id = $1`, [id]).then((user) => {
      if (user.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json(user[0]);
    })
      .catch((err) => {
        res.status(404).json({ error: 'User not found' });
      }));
  }
}
