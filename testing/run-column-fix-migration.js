require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

async function runMigration() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: console.log,
    dialectOptions: {
      ssl: false
    }
  });

  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Load migration file
    const migration = require('./src/migrations/20251218220000-fix-customer-id-type');

    // Create queryInterface
    const queryInterface = sequelize.getQueryInterface();

    console.log('Running migration: 20251218220000-fix-customer-id-type');
    console.log('='.repeat(80) + '\n');

    // Run up migration
    await migration.up(queryInterface, Sequelize);

    console.log('\n' + '='.repeat(80));
    console.log('✓ Migration completed successfully!');
    console.log('='.repeat(80));

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('✗ Migration failed:');
    console.error('='.repeat(80));
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration();
