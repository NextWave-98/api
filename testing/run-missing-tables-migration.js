require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:0726@localhost:5432/ecom', {
  logging: false,
  dialect: 'postgres'
});

async function runMigration() {
  try {
    console.log('\n=== Running Missing Tables Migration ===\n');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'src', 'migrations', 'add-missing-tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the migration
    await sequelize.query(sql);
    
    console.log('\n✓ Migration completed successfully!');
    console.log('\nVerifying tables...\n');
    
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
      console.log(`${exists ? '✓' : '✗'} ${table}: ${exists ? 'Created' : 'Missing'}`);
    }
    
    // Check category count
    const [categories] = await sequelize.query(`
      SELECT COUNT(*) as count FROM product_categories;
    `);
    console.log(`\n✓ Product categories seeded: ${categories[0].count} categories\n`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nDetails:', error);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration();
