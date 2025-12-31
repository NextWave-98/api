'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Fixing permissions-roles relationship...');

    // 1. Remove the incorrect 'roles' column from permissions table
    await queryInterface.removeColumn('permissions', 'roles');
    console.log('  ✓ Removed roles column from permissions table');

    // 2. Remove the incorrect users/permissions/role relation columns that shouldn't exist
    const columnsToCheck = [
      { table: 'users', column: 'role' },
      { table: 'users', column: 'received_payments' },
      { table: 'users', column: 'activity_logs' },
      { table: 'users', column: 'notifications' },
      { table: 'roles', column: 'users' },
      { table: 'roles', column: 'permissions' },
    ];

    for (const { table, column } of columnsToCheck) {
      try {
        const tableDescription = await queryInterface.describeTable(table);
        if (tableDescription[column]) {
          await queryInterface.removeColumn(table, column);
          console.log(`  ✓ Removed ${column} column from ${table} table`);
        }
      } catch (error) {
        // Column might not exist, continue
      }
    }

    // 3. Create the junction table for many-to-many relationship between roles and permissions
    await queryInterface.createTable('_PermissionToRole', {
      A: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      B: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });
    console.log('  ✓ Created _PermissionToRole junction table');

    // 4. Create unique index on the junction table
    await queryInterface.addIndex('_PermissionToRole', ['A', 'B'], {
      unique: true,
      name: '_PermissionToRole_AB_unique',
    });
    console.log('  ✓ Created unique index on _PermissionToRole');

    // 5. Create indexes for faster lookups
    await queryInterface.addIndex('_PermissionToRole', ['A'], {
      name: '_PermissionToRole_A_index',
    });
    await queryInterface.addIndex('_PermissionToRole', ['B'], {
      name: '_PermissionToRole_B_index',
    });
    console.log('  ✓ Created indexes on _PermissionToRole');

    console.log('✅ Permissions-roles relationship fixed successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the junction table
    await queryInterface.dropTable('_PermissionToRole');

    // Add back the roles column to permissions table
    await queryInterface.addColumn('permissions', 'roles', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // Add back the relation columns
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'received_payments', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('users', 'activity_logs', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('users', 'notifications', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('roles', 'users', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('roles', 'permissions', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  }
};
