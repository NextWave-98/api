const { Sequelize } = require('sequelize');
require('dotenv').config();

async function fixSupplierColumns() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log,
  });

  try {
    console.log('🔍 Checking current supplier column types...\n');
    
    const [currentTypes] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'suppliers'
      AND column_name IN ('tax_id', 'registration_number')
      ORDER BY column_name;
    `);
    
    console.log('Current column types:', currentTypes);
    console.log('\n');

    // Check if any need fixing
    const needsFix = currentTypes.some(col => col.data_type === 'uuid');
    
    if (!needsFix) {
      console.log('✅ All columns already have correct types!');
      await sequelize.close();
      return;
    }

    console.log('🔧 Fixing column types...\n');

    // Fix tax_id
    const taxIdCol = currentTypes.find(col => col.column_name === 'tax_id');
    if (taxIdCol && taxIdCol.data_type === 'uuid') {
      console.log('Changing tax_id from UUID to VARCHAR...');
      await sequelize.query(`
        ALTER TABLE suppliers 
        ALTER COLUMN tax_id TYPE VARCHAR(255) USING tax_id::VARCHAR;
      `);
      console.log('✅ tax_id fixed');
    }

    // Fix registration_number
    const regNumCol = currentTypes.find(col => col.column_name === 'registration_number');
    if (regNumCol && regNumCol.data_type === 'uuid') {
      console.log('Changing registration_number from UUID to VARCHAR...');
      await sequelize.query(`
        ALTER TABLE suppliers 
        ALTER COLUMN registration_number TYPE VARCHAR(255) USING registration_number::VARCHAR;
      `);
      console.log('✅ registration_number fixed');
    }

    console.log('\n🔍 Verifying changes...\n');
    
    const [newTypes] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'suppliers'
      AND column_name IN ('tax_id', 'registration_number')
      ORDER BY column_name;
    `);
    
    console.log('New column types:', newTypes);
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

fixSupplierColumns();
