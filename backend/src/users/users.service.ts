import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(public dataSource: DataSource) { }

  async findAll(): Promise<any[]> {
    return await this.dataSource.query('SELECT * FROM auth.users');
  }

  async findOne(id: string): Promise<any | null> {
    const result = await this.dataSource.query('SELECT * FROM auth.users WHERE id = $1', [id]).catch(error => {
      return null;
    });
    return result.length > 0 ? result[0] : null;
  }
}