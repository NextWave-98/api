require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });

async function checkEnums() {
  try {
    const [saleTypes] = await sequelize.query("SELECT unnest(enum_range(NULL::enum_sales_sale_type))::text as value");
    console.log('Valid enum_sales_sale_type values:');
    saleTypes.forEach(r => console.log('  -', r.value));
    
    console.log('\nValid enum_sales_payment_status values:');
    const [paymentStatus] = await sequelize.query("SELECT unnest(enum_range(NULL::enum_sales_payment_status))::text as value");
    paymentStatus.forEach(r => console.log('  -', r.value));
    
    console.log('\nValid enum_sales_status values:');
    const [saleStatus] = await sequelize.query("SELECT unnest(enum_range(NULL::enum_sales_status))::text as value");
    saleStatus.forEach(r => console.log('  -', r.value));
    
    sequelize.close();
  } catch (e) {
    console.error('Error:', e.message);
    sequelize.close();
  }
}

checkEnums();
