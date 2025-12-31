// Migration Templates for Common Operations

// 1. Add Enum Value
await queryInterface.sequelize.query('ALTER TYPE "EnumName" ADD VALUE IF NOT EXISTS \'NEW_VALUE\'');

// 2. Add Column to Table
await queryInterface.addColumn('table_name', 'column_name', {
  type: Sequelize.DataTypes.STRING, // or other type
  allowNull: true, // or false
  defaultValue: null // or default value
});

// 3. Remove Column from Table
await queryInterface.removeColumn('table_name', 'column_name');

// 4. Rename Column
await queryInterface.renameColumn('table_name', 'old_column', 'new_column');

// 5. Change Column Type
await queryInterface.changeColumn('table_name', 'column_name', {
  type: Sequelize.DataTypes.NEW_TYPE,
  allowNull: true // or false
});

// 6. Add Index
await queryInterface.addIndex('table_name', ['column_name']);

// 7. Remove Index
await queryInterface.removeIndex('table_name', ['column_name']);

// 8. Create Table
await queryInterface.createTable('new_table', {
  id: {
    type: Sequelize.DataTypes.UUID,
    primaryKey: true,
    defaultValue: Sequelize.DataTypes.UUIDV4
  },
  // other columns...
});

// 9. Drop Table
await queryInterface.dropTable('table_name');

// 10. Check if column exists before adding
const tableDescription = await queryInterface.describeTable('table_name');
if (!tableDescription.column_name) {
  await queryInterface.addColumn('table_name', 'column_name', {
    type: Sequelize.DataTypes.STRING,
    allowNull: true
  });
}