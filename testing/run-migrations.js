require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:0726@localhost:5432/ecom', {
  logging: console.log,
  dialect: 'postgres'
});

async function runMigrations() {
  try {
    console.log('\n=== Running Missing Tables Migrations ===\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');
    
    const migrations = [
      '20251216000001-create-product-categories.js',
      '20251216000002-create-stock-transfers.js',
      '20251216000003-create-stock-transfer-items.js',
      '20251216000004-create-sale-refunds.js',
      '20251216000005-add-category-to-products.js'
    ];
    
    const migrationsPath = path.join(__dirname, 'src', 'migrations');
    
    for (const migrationFile of migrations) {
      console.log(`Running migration: ${migrationFile}`);
      const migrationPath = path.join(migrationsPath, migrationFile);
      const migration = require(migrationPath);
      
      try {
        await migration.up(sequelize.getQueryInterface(), Sequelize);
        console.log(`✓ ${migrationFile} completed\n`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠ ${migrationFile} - Table already exists, skipping\n`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('=== Verification ===\n');
    
    // Verify tables exist
    const tables = ['product_categories', 'stock_transfers', 'stock_transfer_items', 'sale_refunds'];
    
    for (const table of tables) {
      const [result] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, { bind: [table] });
      
      const exists = result[0].exists;
      console.log(`${exists ? '✓' : '✗'} ${table}: ${exists ? 'Exists' : 'Missing'}`);
    }
    
    // Check category count
    const [categories] = await sequelize.query(`
      SELECT COUNT(*) as count FROM product_categories;
    `);
    console.log(`\n✓ Product categories: ${categories[0].count} seeded\n`);
    
    console.log('=== All Migrations Completed Successfully! ===\n');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    await sequelize.close();
    process.exit(1);
  }
}

runMigrations();
