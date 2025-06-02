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

// Seed files directory
const SEED_DIR = path.join(__dirname, '..', '..', '.devcontainer', 'seeds');
const seedFiles = [
    'initial-data.sql',
    // Add more seed files here as needed
];

console.log('🌱 Starting database seeding...');

// Ensure seed directory exists
if (!fs.existsSync(SEED_DIR)) {
    fs.mkdirSync(SEED_DIR, { recursive: true });

    // Create initial seed file if it doesn't exist
    const initialSeedFile = path.join(SEED_DIR, 'initial-data.sql');
    const initialSeedContent = `-- Initial development data
-- Add your seed data here

-- Example: Insert test users
-- INSERT INTO users (id, email, username, created_at, updated_at) 
-- VALUES 
--   ('550e8400-e29b-41d4-a716-446655440001', 'test@example.com', 'testuser', NOW(), NOW()),
--   ('550e8400-e29b-41d4-a716-446655440002', 'admin@example.com', 'admin', NOW(), NOW());

-- Example: Insert test profiles
-- INSERT INTO profiles (id, username, updated_at) 
-- VALUES 
--   ('550e8400-e29b-41d4-a716-446655440001', 'testuser', NOW()),
--   ('550e8400-e29b-41d4-a716-446655440002', 'admin', NOW());
`;

    fs.writeFileSync(initialSeedFile, initialSeedContent);
    console.log(`📝 Created initial seed file: ${initialSeedFile}`);
}

// Function to execute a seed file
function executeSeedFile(seedFile) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(SEED_DIR, seedFile);

        if (!fs.existsSync(filePath)) {
            console.log(`⏭️  Skipping ${seedFile} (file not found)`);
            resolve();
            return;
        }

        console.log(`🔄 Executing seed file: ${seedFile}`);

        const psqlCommand = `PGPASSWORD="${DB_CONFIG.password}" psql \\
      -h ${DB_CONFIG.host} \\
      -p ${DB_CONFIG.port} \\
      -U ${DB_CONFIG.username} \\
      -d ${DB_CONFIG.database} \\
      -f "${filePath}"`;

        exec(psqlCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Failed to execute ${seedFile}:`, error.message);
                reject(error);
                return;
            }

            if (stderr) {
                console.warn(`⚠️  Warnings for ${seedFile}:`, stderr);
            }

            console.log(`✅ Successfully executed ${seedFile}`);
            resolve();
        });
    });
}

// Execute all seed files sequentially
async function runSeeds() {
    try {
        for (const seedFile of seedFiles) {
            await executeSeedFile(seedFile);
        }
        console.log('🎉 Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Database seeding failed:', error.message);
        process.exit(1);
    }
}

runSeeds(); 