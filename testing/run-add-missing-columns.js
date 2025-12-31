const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
});

async function runMigration() {
  try {
    console.log('🔍 Reading SQL file...\n');
    const sqlFile = path.join(__dirname, 'add-missing-columns-sequelize.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    const statements = sql.split(';').filter(s => s.trim());
    console.log(`📝 Found ${statements.length} SQL statements\n`);
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    console.log('🚀 Executing SQL statements...\n');
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      try {
        await sequelize.query(statement);
        successCount++;
        
        // Extract table and column name for display
        const match = statement.match(/ALTER TABLE "(\w+)" ADD COLUMN "(\w+)"/);
        if (match) {
          console.log(`✅ [${i + 1}/${statements.length}] Added ${match[2]} to ${match[1]}`);
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          skipCount++;
          const match = statement.match(/ALTER TABLE "(\w+)" ADD COLUMN "(\w+)"/);
          if (match) {
            console.log(`⏭️  [${i + 1}/${statements.length}] ${match[2]} already exists in ${match[1]}`);
          }
        } else {
          errorCount++;
          console.error(`❌ [${i + 1}/${statements.length}] Error:`, error.message);
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Successfully added: ${successCount} columns`);
    console.log(`⏭️  Already existed: ${skipCount} columns`);
    console.log(`❌ Errors: ${errorCount} columns`);
    console.log('='.repeat(80));
    
    if (errorCount === 0) {
      console.log('\n🎉 All missing columns added successfully!');
    } else {
      console.log('\n⚠️  Some columns failed to add. Please check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

runMigration();
