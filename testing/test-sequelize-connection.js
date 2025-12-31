require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

async function testConnection() {
  try {
    console.log('Attempting to authenticate...');
    await sequelize.authenticate();
    console.log('✅ Connection successful!');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
