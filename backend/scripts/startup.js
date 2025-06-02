const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_CONFIG = {
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || '5432',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'your-super-secret-and-long-postgres-password',
    database: process.env.DB_NAME || 'postgres'
};

const BACKUP_DIR = path.join(__dirname, '..', '..', '.devcontainer', 'backups');
const SEED_DIR = path.join(__dirname, '..', '..', '.devcontainer', 'seeds');

console.log('🚀 Starting database initialization...');

// Function to wait for database to be ready
function waitForDatabase() {
    return new Promise((resolve, reject) => {
        const maxAttempts = 30;
        let attempts = 0;

        function checkConnection() {
            attempts++;
            console.log(`🔍 Checking database connection (attempt ${attempts}/${maxAttempts})...`);

            const checkCommand = `PGPASSWORD="${DB_CONFIG.password}" pg_isready -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.username}`;

            exec(checkCommand, (error, stdout, stderr) => {
                if (!error) {
                    console.log('✅ Database is ready!');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('❌ Database connection timeout');
                    reject(new Error('Database connection timeout'));
                } else {
                    console.log('⏳ Database not ready yet, waiting...');
                    setTimeout(checkConnection, 2000);
                }
            });
        }

        checkConnection();
    });
}

// Function to run migrations
function runMigrations() {
    return new Promise((resolve, reject) => {
        console.log('🔄 Running database migrations...');

        exec('npm run migration:run', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Migration failed:', error.message);
                reject(error);
                return;
            }

            if (stderr) {
                console.warn('⚠️  Migration warnings:', stderr);
            }

            console.log('✅ Migrations completed successfully!');
            resolve();
        });
    });
}

// Function to restore data if backup exists
function restoreDataIfExists() {
    return new Promise((resolve) => {
        const latestBackupLink = path.join(BACKUP_DIR, 'latest-dev-data.sql');

        if (fs.existsSync(latestBackupLink)) {
            console.log('📦 Found existing backup, restoring data...');

            exec('npm run db:restore', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
                if (error) {
                    console.warn('⚠️  Data restore failed, continuing with fresh database:', error.message);
                } else {
                    console.log('✅ Data restored successfully!');
                }
                resolve();
            });
        } else {
            console.log('📝 No existing backup found, will seed with initial data...');

            // Run seeding if no backup exists
            exec('npm run db:seed', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
                if (error) {
                    console.warn('⚠️  Seeding failed:', error.message);
                } else {
                    console.log('✅ Initial data seeded successfully!');
                }
                resolve();
            });
        }
    });
}

// Main startup sequence
async function startup() {
    try {
        await waitForDatabase();
        await runMigrations();
        await restoreDataIfExists();

        console.log('🎉 Database initialization completed successfully!');
        console.log('');
        console.log('📋 Available commands:');
        console.log('  npm run migration:generate  - Generate new migration');
        console.log('  npm run migration:run       - Run pending migrations');
        console.log('  npm run db:backup          - Backup current data');
        console.log('  npm run db:restore         - Restore from backup');
        console.log('  npm run db:seed            - Seed initial data');
        console.log('');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        process.exit(1);
    }
}

startup(); 