import { Controller, Get, UseGuards, Response, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { ApiParam } from '@nestjs/swagger';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get("users")
  @UseGuards(JwtAuthGuard)
  getAllUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get("users/:id")
  @ApiParam({ name: 'id', required: true, description: 'integer for the id of the user', schema: { type: 'string' } })
  @UseGuards(JwtAuthGuard)
  async getUserByEmail(@Response() res: any, @Param('id') id: string): Promise<any> {
    return this.usersService.findOne(id)
      .then(user => {
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        return res.json(user);
      }
      )
  }
}
