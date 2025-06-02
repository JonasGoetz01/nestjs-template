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

// Backup directory
const BACKUP_DIR = path.join(__dirname, '..', '..', '.devcontainer', 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `dev-data-${timestamp}.sql`);

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Tables to backup (exclude system tables)
const TABLES_TO_BACKUP = [
    'users',
    'files',
    'profiles',
    // Add your custom tables here
];

console.log('🔄 Starting database backup...');
console.log(`📁 Backup location: ${backupFile}`);

// Build pg_dump command
const pgDumpCommand = `PGPASSWORD="${DB_CONFIG.password}" pg_dump \\
  -h ${DB_CONFIG.host} \\
  -p ${DB_CONFIG.port} \\
  -U ${DB_CONFIG.username} \\
  -d ${DB_CONFIG.database} \\
  --data-only \\
  --inserts \\
  --no-owner \\
  --no-privileges \\
  ${TABLES_TO_BACKUP.map(table => `-t ${table}`).join(' ')} \\
  > "${backupFile}"`;

exec(pgDumpCommand, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Backup failed:', error.message);
        process.exit(1);
    }

    if (stderr) {
        console.warn('⚠️  Backup warnings:', stderr);
    }

    // Check if backup file was created and has content
    if (fs.existsSync(backupFile) && fs.statSync(backupFile).size > 0) {
        console.log('✅ Database backup completed successfully!');
        console.log(`📊 Backup size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);

        // Create a symlink to the latest backup
        const latestBackupLink = path.join(BACKUP_DIR, 'latest-dev-data.sql');
        if (fs.existsSync(latestBackupLink)) {
            fs.unlinkSync(latestBackupLink);
        }
        fs.symlinkSync(path.basename(backupFile), latestBackupLink);
        console.log('🔗 Latest backup symlink updated');
    } else {
        console.error('❌ Backup file was not created or is empty');
        process.exit(1);
    }
}); 