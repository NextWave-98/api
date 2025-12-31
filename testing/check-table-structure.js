require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

async function checkTableStructures() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Get all tables in public schema
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tablesToCheck = tables.map(t => t.table_name);
    console.log(`Found ${tablesToCheck.length} tables:`, tablesToCheck.join(', '));
    
    for (const tableName of tablesToCheck) {
      const [results] = await sequelize.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
        ORDER BY ordinal_position;
      `);
      
      console.log(`\n📋 Table: ${tableName}`);
      console.log('  Columns:');
      results.forEach(col => {
        console.log(`    - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
      });
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTableStructures();
