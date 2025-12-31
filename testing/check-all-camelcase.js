const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function checkAllTables() {
  try {
    // Get all table names
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != 'SequelizeMeta'
      ORDER BY table_name
    `);
    
    console.log('🔍 Checking all tables for camelCase columns...\n');
    
    let tablesWithCamelCase = [];
    
    for (const { table_name } of tables) {
      const [columns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table_name}' 
        ORDER BY ordinal_position
      `);
      
      const camelCaseColumns = columns.filter(c => /[a-z][A-Z]/.test(c.column_name));
      
      if (camelCaseColumns.length > 0) {
        tablesWithCamelCase.push({
          table: table_name,
          columns: camelCaseColumns.map(c => c.column_name)
        });
      }
    }
    
    if (tablesWithCamelCase.length === 0) {
      console.log('✅ All tables use snake_case columns!');
    } else {
      console.log('⚠️  Tables with camelCase columns:\n');
      tablesWithCamelCase.forEach(({ table, columns }) => {
        console.log(`📋 ${table}:`);
        columns.forEach(col => console.log(`   - ${col}`));
        console.log('');
      });
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAllTables();
