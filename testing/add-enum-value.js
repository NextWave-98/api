require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function addEnumValue() {
  try {
    await sequelize.query('ALTER TYPE "ReferenceType" ADD VALUE \'STOCK_TRANSFER\'');
    console.log('Successfully added STOCK_TRANSFER to ReferenceType enum');
  } catch (error) {
    console.error('Error adding enum value:', error);
  } finally {
    await sequelize.close();
  }
}

addEnumValue();