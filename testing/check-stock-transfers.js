require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:0726@localhost:5432/ecom', {
  logging: false
});

async function checkTable() {
  const [columns] = await sequelize.query(`
    SELECT column_name, data_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'sale_refunds'
    ORDER BY ordinal_position;
  `);
  
  console.log('sale_refunds columns:');
  columns.forEach(col => {
    console.log(`  ${col.column_name} (${col.data_type})`);
  });
  
  await sequelize.close();
}

checkTable();
