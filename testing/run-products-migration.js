const { Sequelize } = require('sequelize');
require('dotenv').config();

async function runMigration() {
  const sequelize = new Sequelize({
    database: process.env.DB_NAME || 'lts_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: console.log,
  });

  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully\n');

    // Import and run the migration
    const migration = require('./src/migrations/20251217181500-fix-products-table-remove-relation-columns.js');
    
    console.log('🚀 Running migration: fix-products-table-remove-relation-columns\n');
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
