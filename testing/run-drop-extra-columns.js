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
    const sqlFile = path.join(__dirname, 'drop-extra-relation-columns.sql');
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
        const match = statement.match(/ALTER TABLE (\w+) DROP COLUMN IF EXISTS (\w+)/);
        if (match) {
          console.log(`✅ [${i + 1}/${statements.length}] Dropped ${match[2]} from ${match[1]}`);
        }
      } catch (error) {
        if (error.message.includes('does not exist')) {
          skipCount++;
          const match = statement.match(/ALTER TABLE (\w+) DROP COLUMN IF EXISTS (\w+)/);
          if (match) {
            console.log(`⏭️  [${i + 1}/${statements.length}] ${match[2]} does not exist in ${match[1]}`);
          }
        } else {
          errorCount++;
          console.log(`❌ [${i + 1}/${statements.length}] Error: ${error.message}`);
        }
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please check the output above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration();