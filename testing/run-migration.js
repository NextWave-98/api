const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
});

async function runMigration(migrationFile) {
  try {
    console.log(`\n🚀 Running migration: ${migrationFile}\n`);
    
    const migrationPath = path.join(__dirname, 'src', 'migrations', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    const migration = require(migrationPath);
    
    await sequelize.authenticate();
    console.log('✓ Database connected\n');
    
    // Run migration
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log('\n✅ Migration completed successfully!\n');
    
    await sequelize.close();
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Get migration file from command line or find the latest
const migrationFile = process.argv[2];

if (migrationFile) {
  runMigration(migrationFile);
} else {
  // Find latest migration
  const migrationsDir = path.join(__dirname, 'src', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.js'))
    .sort()
    .reverse();
  
  if (files.length > 0) {
    console.log('📂 Available migrations:');
    files.forEach((f, i) => {
      console.log(`   ${i + 1}. ${f}`);
    });
    console.log(`\n🎯 Running latest: ${files[0]}\n`);
    runMigration(files[0]);
  } else {
    console.log('❌ No migration files found');
    process.exit(1);
  }
}
