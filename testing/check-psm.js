const { Sequelize } = require('sequelize');
require('dotenv').config();

async function check() {
  const s = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: 5432,
    dialect: 'postgres',
    logging: false
  });
  
  const [cols] = await s.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name='product_stock_movements' 
    ORDER BY ordinal_position
  `);
  
  console.log('product_stock_movements columns:');
  cols.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));
  
  await s.close();
}

check();
