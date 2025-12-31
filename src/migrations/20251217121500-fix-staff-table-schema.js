'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Fixing staff table schema...');
    
    // Remove incorrect user column (should only have user_id)
    await queryInterface.removeColumn('staff', 'user');
    console.log('  ✓ Removed incorrect user column');
    
    // Change staff_id from UUID to STRING
    await queryInterface.changeColumn('staff', 'staff_id', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
    console.log('  ✓ Changed staff_id from UUID to STRING');
    
    // Change cloudinary_public_id from UUID to STRING (it's a Cloudinary identifier, not a UUID)
    await queryInterface.changeColumn('staff', 'cloudinary_public_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    console.log('  ✓ Changed cloudinary_public_id from UUID to STRING');
    
    console.log('✅ Staff table schema fixed successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔧 Reverting staff table schema changes...');
    
    await queryInterface.addColumn('staff', 'user', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    
    await queryInterface.changeColumn('staff', 'staff_id', {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
    });
    
    await queryInterface.changeColumn('staff', 'cloudinary_public_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    
    console.log('✅ Staff table schema reverted');
  }
};
