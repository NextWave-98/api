const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkTable() {
  const sequelize = new Sequelize(process.env.DATABASE_URL);

  try {
    // Check if table exists
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name = 'job_status_history'"
    );

    console.log('Table exists:', tables.length > 0);

    if (tables.length > 0) {
      // Get columns
      const [columns] = await sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'job_status_history' ORDER BY ordinal_position"
      );

      console.log('Columns:', columns.map(c => c.column_name));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkTable();