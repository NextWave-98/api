const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

// Load environment
require('dotenv').config();

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

// Import all models
const models = require('./dist/models');

// Initialize models
Object.values(models).forEach(model => {
  if (typeof model.initModel === 'function') {
    model.initModel(sequelize);
  }
});

// Map Sequelize types to SQL
function getColumnDefinition(attribute, modelName, attrName) {
  const type = attribute.type;
  let sqlType = '';
  
  // Get SQL type
  if (type instanceof Sequelize.STRING) {
    const length = type._length || 255;
    sqlType = `Sequelize.STRING(${length})`;
  } else if (type instanceof Sequelize.TEXT) {
    sqlType = 'Sequelize.TEXT';
  } else if (type instanceof Sequelize.INTEGER) {
    sqlType = 'Sequelize.INTEGER';
  } else if (type instanceof Sequelize.BIGINT) {
    sqlType = 'Sequelize.BIGINT';
  } else if (type instanceof Sequelize.DECIMAL) {
    const precision = type._precision || 10;
    const scale = type._scale || 2;
    sqlType = `Sequelize.DECIMAL(${precision}, ${scale})`;
  } else if (type instanceof Sequelize.BOOLEAN) {
    sqlType = 'Sequelize.BOOLEAN';
  } else if (type instanceof Sequelize.DATE) {
    sqlType = 'Sequelize.DATE';
  } else if (type instanceof Sequelize.UUID) {
    sqlType = 'Sequelize.UUID';
  } else if (type instanceof Sequelize.ENUM) {
    const values = type.values.map(v => `'${v}'`).join(', ');
    sqlType = `Sequelize.ENUM(${values})`;
  } else if (type instanceof Sequelize.JSONB) {
    sqlType = 'Sequelize.JSONB';
  } else if (type instanceof Sequelize.JSON) {
    sqlType = 'Sequelize.JSON';
  } else {
    sqlType = `Sequelize.${type.constructor.name}`;
  }
  
  // Build column definition
  const def = {
    type: sqlType,
  };
  
  // Add allowNull
  if (attribute.allowNull !== undefined) {
    def.allowNull = attribute.allowNull;
  }
  
  // Add defaultValue
  if (attribute.defaultValue !== undefined) {
    if (attribute.defaultValue === Sequelize.UUIDV4 || attribute.defaultValue === 'uuid_generate_v4()') {
      def.defaultValue = 'Sequelize.UUIDV4';
    } else if (attribute.defaultValue === Sequelize.NOW || attribute.defaultValue === 'CURRENT_TIMESTAMP') {
      def.defaultValue = 'Sequelize.NOW';
    } else if (typeof attribute.defaultValue === 'boolean') {
      def.defaultValue = attribute.defaultValue;
    } else if (typeof attribute.defaultValue === 'number') {
      def.defaultValue = attribute.defaultValue;
    } else if (typeof attribute.defaultValue === 'string') {
      def.defaultValue = `'${attribute.defaultValue}'`;
    }
  }
  
  // Add unique
  if (attribute.unique) {
    def.unique = true;
  }
  
  // Add primaryKey
  if (attribute.primaryKey) {
    def.primaryKey = true;
  }
  
  // Add references
  if (attribute.references) {
    def.references = {
      model: `'${attribute.references.model}'`,
      key: `'${attribute.references.key}'`
    };
    if (attribute.onUpdate) {
      def.onUpdate = `'${attribute.onUpdate}'`;
    }
    if (attribute.onDelete) {
      def.onDelete = `'${attribute.onDelete}'`;
    }
  }
  
  return def;
}

function formatColumnDefinition(def, indent = '        ') {
  const lines = [];
  
  for (const [key, value] of Object.entries(def)) {
    if (key === 'type') {
      lines.push(`${indent}type: ${value},`);
    } else if (key === 'references') {
      lines.push(`${indent}references: {`);
      lines.push(`${indent}  model: ${value.model},`);
      lines.push(`${indent}  key: ${value.key},`);
      lines.push(`${indent}},`);
    } else if (key === 'defaultValue') {
      lines.push(`${indent}${key}: ${value},`);
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      lines.push(`${indent}${key}: ${value},`);
    } else {
      lines.push(`${indent}${key}: ${value},`);
    }
  }
  
  return lines.join('\n');
}

async function generateMigration() {
  try {
    console.log('🔍 Analyzing Sequelize models...\n');
    
    const tables = [];
    const indexes = [];
    
    // Process each model
    for (const [modelName, Model] of Object.entries(models)) {
      if (!Model.tableName || !Model.rawAttributes) continue;
      
      const tableName = Model.tableName;
      console.log(`  ✓ Processing ${modelName} → ${tableName}`);
      
      const columns = {};
      const tableIndexes = [];
      
      // Process each attribute
      for (const [attrName, attribute] of Object.entries(Model.rawAttributes)) {
        const fieldName = attribute.field || attrName;
        
        // Skip virtual attributes
        if (attribute.type && attribute.type.constructor.name === 'VIRTUAL') continue;
        
        columns[fieldName] = getColumnDefinition(attribute, modelName, attrName);
      }
      
      tables.push({
        name: tableName,
        modelName,
        columns
      });
      
      // Collect indexes
      if (Model.options && Model.options.indexes) {
        Model.options.indexes.forEach(index => {
          tableIndexes.push({
            table: tableName,
            fields: index.fields,
            unique: index.unique || false,
            name: index.name
          });
        });
      }
      
      if (tableIndexes.length > 0) {
        indexes.push(...tableIndexes);
      }
    }
    
    console.log(`\n✅ Found ${tables.length} tables with columns\n`);
    
    // Generate migration file
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const migrationName = `${timestamp}-complete-schema-sync.js`;
    const migrationPath = path.join(__dirname, 'src', 'migrations', migrationName);
    
    let migrationContent = `'use strict';

/**
 * COMPLETE SCHEMA SYNC MIGRATION
 * Generated: ${new Date().toISOString()}
 * 
 * This migration creates/updates all tables and columns based on Sequelize models
 * to ensure database schema matches the ORM definitions exactly.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Starting complete schema synchronization...\\n');
    
    // Get existing tables
    const existingTables = await queryInterface.showAllTables();
    console.log(\`📊 Found \${existingTables.length} existing tables\\n\`);
    
`;

    // Generate table creations and column additions
    for (const table of tables) {
      migrationContent += `    // ========================================\n`;
      migrationContent += `    // ${table.modelName} → ${table.name}\n`;
      migrationContent += `    // ========================================\n`;
      migrationContent += `    if (!existingTables.includes('${table.name}')) {\n`;
      migrationContent += `      console.log('📝 Creating table: ${table.name}');\n`;
      migrationContent += `      await queryInterface.createTable('${table.name}', {\n`;
      
      // Add columns
      for (const [colName, colDef] of Object.entries(table.columns)) {
        migrationContent += `        ${colName}: {\n`;
        migrationContent += formatColumnDefinition(colDef);
        migrationContent += `\n        },\n`;
      }
      
      migrationContent += `      });\n`;
      migrationContent += `    } else {\n`;
      migrationContent += `      console.log('🔄 Updating table: ${table.name}');\n`;
      migrationContent += `      \n`;
      migrationContent += `      // Get existing columns\n`;
      migrationContent += `      const tableInfo = await queryInterface.describeTable('${table.name}');\n`;
      migrationContent += `      const existingColumns = Object.keys(tableInfo);\n`;
      migrationContent += `      \n`;
      
      // Add missing columns
      for (const [colName, colDef] of Object.entries(table.columns)) {
        migrationContent += `      // Add ${colName} if missing\n`;
        migrationContent += `      if (!existingColumns.includes('${colName}')) {\n`;
        migrationContent += `        console.log('  ➕ Adding column: ${table.name}.${colName}');\n`;
        migrationContent += `        await queryInterface.addColumn('${table.name}', '${colName}', {\n`;
        migrationContent += formatColumnDefinition(colDef);
        migrationContent += `\n        });\n`;
        migrationContent += `      }\n`;
        migrationContent += `      \n`;
      }
      
      migrationContent += `    }\n`;
      migrationContent += `    \n`;
    }
    
    // Add indexes
    if (indexes.length > 0) {
      migrationContent += `    // ========================================\n`;
      migrationContent += `    // INDEXES\n`;
      migrationContent += `    // ========================================\n`;
      migrationContent += `    console.log('\\n📑 Creating indexes...');\n`;
      migrationContent += `    \n`;
      
      for (const index of indexes) {
        const indexName = index.name || `idx_${index.table}_${index.fields.join('_')}`;
        const fields = JSON.stringify(index.fields);
        migrationContent += `    await queryInterface.addIndex('${index.table}', ${fields}, {\n`;
        migrationContent += `      name: '${indexName}',\n`;
        if (index.unique) {
          migrationContent += `      unique: true,\n`;
        }
        migrationContent += `    }).catch(() => {});\n`;
        migrationContent += `    \n`;
      }
    }
    
    migrationContent += `    console.log('\\n✅ Schema synchronization completed!\\n');\n`;
    migrationContent += `  },\n\n`;
    
    // Generate down migration
    migrationContent += `  async down(queryInterface, Sequelize) {\n`;
    migrationContent += `    console.log('⚠️  Rolling back schema changes...\\n');\n`;
    migrationContent += `    // Note: This will drop all tables - use with caution!\n`;
    migrationContent += `    \n`;
    
    for (const table of tables.reverse()) {
      migrationContent += `    await queryInterface.dropTable('${table.name}').catch(() => {});\n`;
    }
    
    migrationContent += `    \n`;
    migrationContent += `    console.log('\\n✅ Rollback completed!\\n');\n`;
    migrationContent += `  }\n`;
    migrationContent += `};\n`;
    
    // Save migration file
    fs.writeFileSync(migrationPath, migrationContent);
    
    console.log('📄 Migration file generated:');
    console.log(`   ${migrationPath}\n`);
    
    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      migrationFile: migrationName,
      tablesCount: tables.length,
      indexesCount: indexes.length,
      tables: tables.map(t => ({
        name: t.name,
        model: t.modelName,
        columnsCount: Object.keys(t.columns).length,
        columns: Object.keys(t.columns)
      }))
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'migration-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('📊 Summary:');
    console.log(`   Tables: ${tables.length}`);
    console.log(`   Indexes: ${indexes.length}`);
    console.log(`   Total columns: ${tables.reduce((sum, t) => sum + Object.keys(t.columns).length, 0)}\n`);
    
    console.log('🎯 Next steps:');
    console.log('   1. Review the generated migration file');
    console.log('   2. Run: npm run migrate:up');
    console.log('   3. Or manually: node run-migration.js\n');
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

generateMigration();
