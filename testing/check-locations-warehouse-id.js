require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false
});

async function checkLocationsColumns() {
  try {
    const [warehouseResults] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'locations' AND column_name = 'warehouse_id'
    `);
    console.log('warehouse_id column:', warehouseResults);

    const [branchResults] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'locations' AND column_name = 'branch_id'
    `);
    console.log('branch_id column:', branchResults);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkLocationsColumns();