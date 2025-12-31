require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('./src/config/database.config');

const sequelize = new Sequelize(config.development);

async function verifySchema() {
  try {
    console.log('🔍 Verifying database schema...\n');

    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != 'SequelizeMeta'
      ORDER BY table_name;
    `);

    console.log(`✅ Found ${tables.length} tables:\n`);
    tables.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.table_name}`);
    });

    // Get all enums
    const [enums] = await sequelize.query(`
      SELECT DISTINCT t.typname as enum_name
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname;
    `);

    console.log(`\n✅ Found ${enums.length} enum types:\n`);
    enums.slice(0, 10).forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.enum_name}`);
    });
    if (enums.length > 10) {
      console.log(`   ... and ${enums.length - 10} more`);
    }

    // Get foreign key count
    const [fkCount] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints 
      WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public';
    `);

    console.log(`\n✅ Found ${fkCount[0].count} foreign key constraints\n`);

    console.log('🎉 Database schema verification complete!\n');
    console.log('Summary:');
    console.log(`   - Tables: ${tables.length}`);
    console.log(`   - Enums: ${enums.length}`);
    console.log(`   - Foreign Keys: ${fkCount[0].count}`);

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error verifying schema:', error.message);
    process.exit(1);
  }
}

verifySchema();
