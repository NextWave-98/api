/**
 * SIMPLE APPROACH: Generate migration by parsing existing migration files
 * and Prisma schema to create a complete one-time migration
 */

const fs = require('fs');
const path = require('path');

// Read the Prisma schema (go up two levels from src/scripts to root)
const schemaPath = path.join(__dirname, '..', '..', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Read existing migration files to understand the structure
const existingMigrationPath = path.join(__dirname, '..', 'migrations', '20251212000000-create-initial-schema.js');

console.log('📖 Generating complete Sequelize migration from Prisma schema...\n');

// Parse Prisma models
const models = [];
const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
let match;

while ((match = modelRegex.exec(schemaContent)) !== null) {
  const modelName = match[1];
  const modelContent = match[2];
  
  // Get table name
  const mapMatch = modelContent.match(/@@map\("([^"]+)"\)/);
  const tableName = mapMatch ? mapMatch[1] : camelToSnake(modelName);
  
  // Extract fields
  const fields = [];
  const fieldLines = modelContent.split('\n').filter(line => 
    line.trim() && 
    !line.trim().startsWith('//') && 
    !line.trim().startsWith('@@') &&
    !line.trim().startsWith('!')
  );
  
  for (const line of fieldLines) {
    const fieldMatch = line.match(/^\s*(\w+)\s+(\w+[\?\[\]]*)/);
    if (fieldMatch && !line.includes('@relation')) {
      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2];
      
      const mapFieldMatch = line.match(/@map\("([^"]+)"\)/);
      const dbColumn = mapFieldMatch ? mapFieldMatch[1] : camelToSnake(fieldName);
      
      const isOptional = fieldType.includes('?');
      const isArray = fieldType.includes('[]');
      const cleanType = fieldType.replace(/[\?\[\]]/g, '');
      
      const defaultMatch = line.match(/@default\(([^)]+)\)/);
      const isUnique = line.includes('@unique');
      const isId = line.includes('@id');
      
      fields.push({
        name: fieldName,
        column: dbColumn,
        type: cleanType,
        optional: isOptional,
        isArray,
        default: defaultMatch ? defaultMatch[1] : null,
        unique: isUnique,
        isId
      });
    }
  }
  
  models.push({
    name: modelName,
    table: tableName,
    fields
  });
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function mapPrismaToSequelize(prismaType, isOptional, defaultValue) {
  const typeMap = {
    'String': 'Sequelize.STRING',
    'Int': 'Sequelize.INTEGER',
    'BigInt': 'Sequelize.BIGINT',
    'Float': 'Sequelize.FLOAT',
    'Decimal': 'Sequelize.DECIMAL(12, 2)',
    'Boolean': 'Sequelize.BOOLEAN',
    'DateTime': 'Sequelize.DATE',
    'Json': 'Sequelize.JSONB',
    'Bytes': 'Sequelize.BLOB',
  };
  
  let sqlType = typeMap[prismaType] || 'Sequelize.STRING';
  
  return {
    type: sqlType,
    allowNull: isOptional,
    defaultValue
  };
}

function formatField(field) {
  const def = mapPrismaToSequelize(field.type, field.optional, field.default);
  
  let code = `        ${field.column}: {\n`;
  code += `          type: ${def.type},\n`;
  
  if (field.isId) {
    code += `          primaryKey: true,\n`;
  }
  
  if (field.default === 'uuid()' || field.default === 'gen_random_uuid()') {
    code += `          defaultValue: Sequelize.UUIDV4,\n`;
  } else if (field.default === 'now()' || field.default === 'CURRENT_TIMESTAMP') {
    code += `          defaultValue: Sequelize.NOW,\n`;
  } else if (field.default === 'true') {
    code += `          defaultValue: true,\n`;
  } else if (field.default === 'false') {
    code += `          defaultValue: false,\n`;
  } else if (field.default && !isNaN(field.default)) {
    code += `          defaultValue: ${field.default},\n`;
  } else if (field.default && field.default.startsWith('"')) {
    code += `          defaultValue: ${field.default},\n`;
  }
  
  if (!field.optional && !field.isId) {
    code += `          allowNull: false,\n`;
  }
  
  if (field.unique) {
    code += `          unique: true,\n`;
  }
  
  code += `        },\n`;
  
  return code;
}

// Generate migration
const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
const migrationName = `${timestamp}-sync-all-columns.js`;

let migration = `'use strict';

/**
 * COMPLETE COLUMN SYNC MIGRATION
 * Generated from Prisma schema: ${new Date().toISOString()}
 * 
 * This migration adds all missing columns to existing tables
 * ensuring complete schema compatibility.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Syncing all columns from Prisma schema...\\n');
    
`;

// For each model, add missing columns
for (const model of models) {
  migration += `    // ========================================\n`;
  migration += `    // ${model.name} → ${model.table}\n`;
  migration += `    // ========================================\n`;
  migration += `    try {\n`;
  migration += `      const ${model.name}TableInfo = await queryInterface.describeTable('${model.table}');\n`;
  migration += `      const ${model.name}Columns = Object.keys(${model.name}TableInfo);\n`;
  migration += `      \n`;
  
  for (const field of model.fields) {
    migration += `      if (!${model.name}Columns.includes('${field.column}')) {\n`;
    migration += `        console.log('  ➕ Adding ${model.table}.${field.column}');\n`;
    migration += `        await queryInterface.addColumn('${model.table}', '${field.column}', {\n`;
    
    const def = mapPrismaToSequelize(field.type, field.optional, field.default);
    migration += `          type: ${def.type},\n`;
    
    if (field.default === 'uuid()' || field.default === 'gen_random_uuid()') {
      migration += `          defaultValue: Sequelize.UUIDV4,\n`;
    } else if (field.default === 'now()' || field.default === 'CURRENT_TIMESTAMP') {
      migration += `          defaultValue: Sequelize.NOW,\n`;
    } else if (field.default === 'true') {
      migration += `          defaultValue: true,\n`;
    } else if (field.default === 'false') {
      migration += `          defaultValue: false,\n`;
    } else if (field.default && !isNaN(field.default)) {
      migration += `          defaultValue: ${field.default},\n`;
    }
    
    if (!field.optional) {
      migration += `          allowNull: false,\n`;
    }
    
    if (field.unique) {
      migration += `          unique: true,\n`;
    }
    
    migration += `        });\n`;
    migration += `      }\n`;
    migration += `      \n`;
  }
  
  migration += `    } catch (error) {\n`;
  migration += `      console.log('  ⚠️  Table ${model.table} might not exist yet:', error.message);\n`;
  migration += `    }\n`;
  migration += `    \n`;
}

migration += `    console.log('\\n✅ Column sync completed!\\n');\n`;
migration += `  },\n\n`;

migration += `  async down(queryInterface, Sequelize) {\n`;
migration += `    console.log('⚠️  This migration does not support rollback.\\n');\n`;
migration += `    console.log('Manual column removal required if needed.\\n');\n`;
migration += `  }\n`;
migration += `};\n`;

// Save migration (go up one level from src/scripts to src)
const migrationsDir = path.join(__dirname, '..', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
  console.log('📁 Created migrations directory\n');
}

const migrationPath = path.join(migrationsDir, migrationName);
fs.writeFileSync(migrationPath, migration);

console.log('✅ Migration generated successfully!\n');
console.log(`📄 File: ${migrationName}\n`);
console.log(`📊 Summary:`);
console.log(`   - Models processed: ${models.length}`);
console.log(`   - Total fields: ${models.reduce((sum, m) => sum + m.fields.length, 0)}\n`);

console.log('🎯 To run the migration:');
console.log(`   npm run migrate\n`);
console.log(`   or: node run-migration.js ${migrationName}\n`);

// Save summary (save to root directory)
fs.writeFileSync(
  path.join(__dirname, '..', '..', 'column-sync-summary.json'),
  JSON.stringify({ models, timestamp, migrationName }, null, 2)
);
