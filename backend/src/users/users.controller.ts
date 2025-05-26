import { Controller, Get, UseGuards, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { ApiParam } from '@nestjs/swagger';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  async getAllUsers(): Promise<any[]> {
    return await this.usersService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', required: true, description: 'ID of the user', schema: { type: 'string' } })
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