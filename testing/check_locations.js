const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgresql://postgres:0726@localhost:5432/ecom?schema=public');

(async () => {
  try {
    const [results] = await sequelize.query(`SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'branches' AND table_schema = 'public' ORDER BY ordinal_position;`);
    console.log('Branches table columns:');
    results.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
})();