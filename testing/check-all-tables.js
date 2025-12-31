require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false
});

async function checkAllTables() {
  try {
    // Get all tables from the database
    const [tableResults] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = tableResults.map(row => row.table_name);

    console.log(`Found ${tables.length} tables in the database:\n`);
    tables.forEach(table => console.log(`  - ${table}`));
    console.log('\n' + '='.repeat(80) + '\n');

    for (const table of tables) {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, {
        bind: [table]
      });

      console.log(`\n${'='.repeat(60)}`);
      console.log(`TABLE: ${table.toUpperCase()}`);
      console.log('='.repeat(60));
      
      if (columns.length === 0) {
        console.log('  ⚠️  TABLE DOES NOT EXIST');
      } else {
        console.log(`Total columns: ${columns.length}\n`);
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          console.log(`  • ${col.column_name.padEnd(35)} ${col.data_type.padEnd(20)} ${nullable}`);
        });
      }
    }

    await sequelize.close();
    console.log('\n' + '='.repeat(60));
    console.log('✓ Check complete');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkAllTables();
