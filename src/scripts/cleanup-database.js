/**
 * Clean up database before running migrations
 * Drops all existing enums and tables
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'lts_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false,
  }
);

async function cleanup() {
  try {
    console.log('🧹 Cleaning up database...\n');
    
    // Get all enum types
    const [enums] = await sequelize.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);
    
    console.log(`Found ${enums.length} enum types to drop\n`);
    
    // Drop all enums
    for (const enumType of enums) {
      const typeName = enumType.typname;
      try {
        await sequelize.query(`DROP TYPE IF EXISTS "${typeName}" CASCADE`);
        console.log(`  ✓ Dropped enum: ${typeName}`);
      } catch (error) {
        console.log(`  ⚠️  Could not drop ${typeName}:`, error.message);
      }
    }
    
    // Get all tables except SequelizeMeta
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != 'SequelizeMeta'
    `);
    
    console.log(`\nFound ${tables.length} tables to drop\n`);
    
    // Drop all tables
    for (const table of tables) {
      const tableName = table.table_name;
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        console.log(`  ✓ Dropped table: ${tableName}`);
      } catch (error) {
        console.log(`  ⚠️  Could not drop ${tableName}:`, error.message);
      }
    }
    
    console.log('\n✅ Database cleaned successfully!\n');
    console.log('🎯 Now run: npm run migrate\n');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

cleanup();
