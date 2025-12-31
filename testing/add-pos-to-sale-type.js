require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function addPOSToSaleType() {
  try {
    // Try the custom type name first
    await sequelize.query('ALTER TYPE "SaleType" ADD VALUE \'POS\'');
    console.log('✅ Successfully added POS to SaleType enum');
  } catch (error) {
    console.error('❌ Error adding to SaleType:', error.message);
    try {
      // Try the auto-generated name
      await sequelize.query('ALTER TYPE "enum_sales_sale_type" ADD VALUE \'POS\'');
      console.log('✅ Successfully added POS to enum_sales_sale_type');
    } catch (error2) {
      console.error('❌ Error adding to enum_sales_sale_type:', error2.message);
    }
  } finally {
    await sequelize.close();
  }
}

addPOSToSaleType();