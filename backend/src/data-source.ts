import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'your-super-secret-and-long-postgres-password',
    database: process.env.DB_NAME || 'postgres',
    entities: [
        __dirname + '/entities/**/*.entity{.ts,.js}',
        __dirname + '/files/entities/*.entity{.ts,.js}',
    ],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    migrationsRun: true, // Automatically run migrations on startup
}); 