const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/lts_db', {
  logging: false
});

async function checkColumns() {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'warranty_cards' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n=== WARRANTY_CARDS TABLE COLUMNS ===');
    results.forEach(r => {
      console.log(`  ${r.column_name} (${r.data_type})`);
    });
    
    const [claimResults] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'warranty_claims' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n=== WARRANTY_CLAIMS TABLE COLUMNS ===');
    claimResults.forEach(r => {
      console.log(`  ${r.column_name} (${r.data_type})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkColumns();
