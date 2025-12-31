const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgresql://postgres:0726@localhost:5432/ecom?schema=public');

(async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'po_status_history'
      ORDER BY ordinal_position
    `);
    console.log('Current columns in po_status_history:');
    results.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? 'DEFAULT: ' + row.column_default : ''}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
})();