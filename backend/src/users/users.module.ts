
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { UsersController } from './users.controller';
import { AuthService } from 'src/auth/auth.service';
import { UserViewService } from './services/user-view-simple.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, AuthService, UserViewService],
  controllers: [UsersController],
})
export class UsersModule { }
