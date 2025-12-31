const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkConstraints() {
  const sequelize = new Sequelize(process.env.DATABASE_URL);

  try {
    const result = await sequelize.query(`
      SELECT conname, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conrelid = 'job_sheets'::regclass;
    `);

    console.log('Constraints on job_sheets:');
    result[0].forEach(con => {
      console.log(`${con.conname}: ${con.pg_get_constraintdef}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkConstraints();