import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(public dataSource: DataSource) { }

  async findAll(): Promise<User[]> {
    return await this.dataSource.query('SELECT * FROM auth.users');
  }

  async findOne(id: string): Promise<User | null> {
    const result = await this.dataSource.query('SELECT * FROM auth.users WHERE id = $1', [id]).catch(error => {
      return null;
    });
    return result.length > 0 ? result[0] : null;
  }
}