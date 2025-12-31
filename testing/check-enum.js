require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function checkEnum() {
  try {
    const result = await sequelize.query("SELECT unnest(enum_range(NULL::\"StockMovementType\")) as value");
    console.log('StockMovementType enum values:', result[0].map(r => r.value));
    
    const result2 = await sequelize.query("SELECT unnest(enum_range(NULL::\"ReferenceType\")) as value");
    console.log('ReferenceType enum values:', result2[0].map(r => r.value));
  } catch (error) {
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

checkEnum();