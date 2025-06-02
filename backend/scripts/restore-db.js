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

// Get backup file from command line argument or use latest
const backupFileName = process.argv[2];
let backupFile;

if (backupFileName) {
    backupFile = path.join(BACKUP_DIR, backupFileName);
} else {
    // Use the latest backup
    const latestBackupLink = path.join(BACKUP_DIR, 'latest-dev-data.sql');
    if (fs.existsSync(latestBackupLink)) {
        backupFile = latestBackupLink;
    } else {
        console.error('❌ No backup file specified and no latest backup found');
        console.log('Usage: npm run db:restore [backup-filename]');
        console.log('Available backups:');
        if (fs.existsSync(BACKUP_DIR)) {
            const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql') && f !== 'latest-dev-data.sql');
            backups.forEach(backup => console.log(`  - ${backup}`));
        }
        process.exit(1);
    }
}

// Check if backup file exists
if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`);
    process.exit(1);
}

console.log('🔄 Starting database restore...');
console.log(`📁 Restoring from: ${backupFile}`);

// Build psql command
const psqlCommand = `PGPASSWORD="${DB_CONFIG.password}" psql \\
  -h ${DB_CONFIG.host} \\
  -p ${DB_CONFIG.port} \\
  -U ${DB_CONFIG.username} \\
  -d ${DB_CONFIG.database} \\
  -f "${backupFile}"`;

exec(psqlCommand, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Restore failed:', error.message);
        process.exit(1);
    }

    if (stderr) {
        console.warn('⚠️  Restore warnings:', stderr);
    }

    if (stdout) {
        console.log('📋 Restore output:', stdout);
    }

    console.log('✅ Database restore completed successfully!');
}); 