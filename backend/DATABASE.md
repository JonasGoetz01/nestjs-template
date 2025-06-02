# Database Migration & Backup System

This project includes a comprehensive database migration and backup system that automatically handles database schema changes and development data persistence across dev container restarts.

## 🚀 How It Works

### Automatic Migration System
- **TypeORM migrations** are automatically run when the dev container starts
- Migrations are stored in `src/migrations/` directory
- The system ensures your database schema is always up-to-date

### Development Data Backup & Restore
- **Automatic backup creation** when you make data changes
- **Automatic restore** when other developers open the dev container
- Backups are stored in `.devcontainer/backups/` directory
- Latest backup is always available via symlink

## 📋 Available Commands

### Migration Commands
```bash
# Generate a new migration based on entity changes
npm run migration:generate

# Create an empty migration file
npm run migration:create

# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

### Data Management Commands
```bash
# Backup current development data
npm run db:backup

# Restore from latest backup
npm run db:restore

# Restore from specific backup file
npm run db:restore dev-data-2024-01-15T10-30-00-000Z.sql

# Seed database with initial data
npm run db:seed
```

## 🔄 Workflow for Database Changes

### 1. Making Schema Changes

1. **Modify your entities** in `src/entities/` or `src/*/entities/`
2. **Generate migration**:
   ```bash
   npm run migration:generate
   ```
3. **Review the generated migration** in `src/migrations/`
4. **Test the migration**:
   ```bash
   npm run migration:run
   ```

### 2. Sharing Development Data

1. **Create a backup** after adding test data:
   ```bash
   npm run db:backup
   ```
2. **Commit the backup** to version control (optional)
3. **Other developers** will automatically get the data when they start their dev container

### 3. Working with Existing Data

When you start the dev container:
- ✅ Database connection is established
- ✅ Migrations are automatically run
- ✅ Latest backup is restored (if available)
- ✅ Initial seed data is loaded (if no backup exists)

## 📁 Directory Structure

```
.devcontainer/
├── backups/                    # Database backups
│   ├── dev-data-*.sql         # Timestamped backups
│   └── latest-dev-data.sql    # Symlink to latest backup
└── seeds/                     # Seed data files
    └── initial-data.sql       # Initial development data

backend/
├── src/
│   ├── migrations/            # TypeORM migration files
│   ├── entities/              # Database entities
│   └── data-source.ts         # TypeORM configuration
└── scripts/                   # Database management scripts
    ├── backup-db.js           # Backup script
    ├── restore-db.js          # Restore script
    ├── seed-db.js             # Seeding script
    └── startup.js             # Container startup script
```

## ⚙️ Configuration

### Database Connection
The system uses these environment variables (with defaults):
- `DB_HOST` (default: 'db')
- `DB_PORT` (default: '5432')
- `DB_USERNAME` (default: 'postgres')
- `DB_PASSWORD` (default: 'your-super-secret-and-long-postgres-password')
- `DB_NAME` (default: 'postgres')

### Tables to Backup
Edit `backend/scripts/backup-db.js` to specify which tables to include in backups:
```javascript
const TABLES_TO_BACKUP = [
  'users',
  'files',
  'profiles',
  // Add your custom tables here
];
```

## 🛠️ Troubleshooting

### Migration Issues
```bash
# Check migration status
npm run migration:show

# Revert last migration if needed
npm run migration:revert

# Manually run migrations
npm run migration:run
```

### Backup/Restore Issues
```bash
# List available backups
ls -la .devcontainer/backups/

# Restore from specific backup
npm run db:restore filename.sql

# Create fresh backup
npm run db:backup
```

### Starting Fresh
If you need to reset everything:
```bash
# This will remove all containers and reset data
.devcontainer/reset.sh
```

## 🔧 Advanced Usage

### Custom Seed Data
1. Edit `.devcontainer/seeds/initial-data.sql`
2. Add your custom INSERT statements
3. Run: `npm run db:seed`

### Multiple Seed Files
1. Add new `.sql` files to `.devcontainer/seeds/`
2. Update the `seedFiles` array in `backend/scripts/seed-db.js`
3. Files are executed in order

### Backup Automation
The backup system can be integrated into your development workflow:
- Run `npm run db:backup` after significant data changes
- Commit important backups to version control
- Use in CI/CD for test data management

## 🚨 Important Notes

- **Migrations are irreversible** by default - always backup before major changes
- **Backups include data only** - schema changes require migrations
- **Latest backup is automatically restored** on container startup
- **Seed data is only used** when no backup exists
- **Always test migrations** in development before production 