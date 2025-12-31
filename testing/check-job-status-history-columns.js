const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(process.env.DATABASE_URL);

(async () => {
  try {
    const [results] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'job_status_history' ORDER BY ordinal_position;");
    console.log('job_status_history columns:');
    results.forEach(row => console.log(' -', row.column_name));
  } catch (err) {
    console.log('Error:', err.message);
  }
  process.exit(0);
})();