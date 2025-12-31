const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkPayments() {
  const sequelize = new Sequelize(process.env.DATABASE_URL);
  try {
    const [payments] = await sequelize.query(
      "SELECT * FROM payments WHERE job_sheet_id = 'd56050d9-5b34-4e18-883d-10f5851d1e0d'"
    );
    console.log('Payments found:', payments.length);
    console.log('Payments:', payments);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkPayments();