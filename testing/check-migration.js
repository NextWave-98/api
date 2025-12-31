require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false
});

async function checkMigration() {
  try {
    const [results] = await sequelize.query(`
      SELECT name FROM "SequelizeMeta"
      WHERE name = '20251217172523-add-warehouse-id-to-locations.js'
    `);
    console.log('Migration in meta:', results);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkMigration();