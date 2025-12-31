const { Sequelize } = require('sequelize');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

console.log('DATABASE_URL:', databaseUrl);
console.log('PGUSER:', process.env.PGUSER);

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: console.log,
});

async function test() {
  try {
    await sequelize.authenticate();
    console.log('\n✅ Sequelize connected successfully!');
    
    // Try to query the table
    const result = await sequelize.query(
      'SELECT * FROM notification_settings LIMIT 1',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('\n✅ Query successful! Result:', result);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

test();
