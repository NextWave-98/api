'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Fixing supplier table column types (UUID to VARCHAR)...');
    
    try {
      // Check current column types
      const [taxIdInfo] = await queryInterface.sequelize.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'tax_id';
      `);

      const [regNumInfo] = await queryInterface.sequelize.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'registration_number';
      `);

      // Fix tax_id if it's UUID
      if (taxIdInfo.length > 0 && taxIdInfo[0].data_type === 'uuid') {
        console.log('  🔄 Converting tax_id from UUID to VARCHAR...');
        await queryInterface.sequelize.query(`
          ALTER TABLE suppliers 
          ALTER COLUMN tax_id TYPE VARCHAR(255) USING tax_id::VARCHAR;
        `);
        console.log('  ✓ tax_id converted to VARCHAR(255)');
      } else {
        console.log('  ✓ tax_id already has correct type');
      }

      // Fix registration_number if it's UUID
      if (regNumInfo.length > 0 && regNumInfo[0].data_type === 'uuid') {
        console.log('  🔄 Converting registration_number from UUID to VARCHAR...');
        await queryInterface.sequelize.query(`
          ALTER TABLE suppliers 
          ALTER COLUMN registration_number TYPE VARCHAR(255) USING registration_number::VARCHAR;
        `);
        console.log('  ✓ registration_number converted to VARCHAR(255)');
      } else {
        console.log('  ✓ registration_number already has correct type');
      }

      console.log('✅ Supplier column types fixed successfully!');
    } catch (error) {
      console.error('❌ Error fixing supplier columns:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('⏪ Reverting supplier column types (VARCHAR to UUID)...');
    
    try {
      // Note: This rollback assumes original values were valid UUIDs
      // In practice, rolling back might cause data loss if non-UUID values exist
      
      console.log('  🔄 Converting tax_id from VARCHAR to UUID...');
      await queryInterface.sequelize.query(`
        ALTER TABLE suppliers 
        ALTER COLUMN tax_id TYPE UUID USING tax_id::UUID;
      `);
      console.log('  ✓ tax_id converted back to UUID');

      console.log('  🔄 Converting registration_number from VARCHAR to UUID...');
      await queryInterface.sequelize.query(`
        ALTER TABLE suppliers 
        ALTER COLUMN registration_number TYPE UUID USING registration_number::UUID;
      `);
      console.log('  ✓ registration_number converted back to UUID');

      console.log('✅ Supplier column types reverted successfully!');
    } catch (error) {
      console.error('❌ Error reverting supplier columns:', error.message);
      console.error('⚠️  Note: Rollback may fail if non-UUID values exist in the columns');
      throw error;
    }
  }
};
