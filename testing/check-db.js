const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    const [results] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
    );
    
    console.log(`📊 Found ${results.length} tables in database:\n`);
    
    if (results.length === 0) {
      console.log('⚠️  Database is empty - no tables found');
      console.log('\n💡 Next steps:');
      console.log('1. Run Prisma migrations: npm run prisma:migrate');
      console.log('2. Or generate schema from Sequelize models');
    } else {
      results.forEach(r => console.log(`  - ${r.tablename}`));
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
