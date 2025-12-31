/**
 * Generate initial CREATE TABLE migration from Sequelize models
 * This script reads your Prisma schema and generates a proper Sequelize migration
 * that creates all tables with proper structure
 */

const fs = require('fs');
const path = require('path');

// Read the Prisma schema
const schemaPath = path.join(__dirname, '..', '..', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

console.log('📖 Generating initial CREATE TABLE migration from Prisma schema...\n');

// Parse Prisma enums
const enums = [];
const enumRegex = /enum\s+(\w+)\s*{([^}]+)}/g;
let match;

while ((match = enumRegex.exec(schemaContent)) !== null) {
  const enumName = match[1];
  const enumContent = match[2];
  const values = enumContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'))
    .map(value => {
      // Remove comments and commas from enum values
      const cleanValue = value.split('//')[0].trim().replace(/,/g, '');
      return cleanValue;
    })
    .filter(value => value); // Remove empty values
  
  enums.push({ name: enumName, values });
}

// Parse Prisma models
const models = [];
const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;

while ((match = modelRegex.exec(schemaContent)) !== null) {
  const modelName = match[1];
  const modelContent = match[2];
  
  // Get table name
  const mapMatch = modelContent.match(/@@map\("([^"]+)"\)/);
  const tableName = mapMatch ? mapMatch[1] : camelToSnake(modelName);
  
  // Extract fields
  const fields = [];
  const relations = [];
  const fieldLines = modelContent.split('\n').filter(line => 
    line.trim() && 
    !line.trim().startsWith('//') && 
    !line.trim().startsWith('@@') &&
    !line.trim().startsWith('!')
  );
  
  for (const line of fieldLines) {
    const fieldMatch = line.match(/^\s*(\w+)\s+(\w+[\?\[\]]*)/);
    if (fieldMatch) {
      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2];
      
      // Skip relations
      if (line.includes('@relation')) {
        const mapFieldMatch = line.match(/@map\("([^"]+)"\)/);
        const dbColumn = mapFieldMatch ? mapFieldMatch[1] : camelToSnake(fieldName);
        const referencesMatch = line.match(/references:\s*([^\s,)]+)/);
        const fieldsMatch = line.match(/fields:\s*\[([^\]]+)\]/);
        
        if (fieldsMatch && referencesMatch) {
          relations.push({
            field: fieldName,
            column: dbColumn,
            type: fieldType.replace(/[\?\[\]]/g, ''),
            references: referencesMatch[1]
          });
        }
        continue;
      }
      
      const mapFieldMatch = line.match(/@map\("([^"]+)"\)/);
      const dbColumn = mapFieldMatch ? mapFieldMatch[1] : camelToSnake(fieldName);
      
      const isOptional = fieldType.includes('?');
      const isArray = fieldType.includes('[]');
      const cleanType = fieldType.replace(/[\?\[\]]/g, '');
      
      const defaultMatch = line.match(/@default\(([^)]+)\)/);
      const isUnique = line.includes('@unique');
      const isId = line.includes('@id');
      const isUpdatedAt = line.includes('@updatedAt');
      
      fields.push({
        name: fieldName,
        column: dbColumn,
        type: cleanType,
        optional: isOptional,
        isArray,
        default: defaultMatch ? defaultMatch[1] : null,
        unique: isUnique,
        isId,
        isUpdatedAt
      });
    }
  }
  
  models.push({
    name: modelName,
    table: tableName,
    fields,
    relations
  });
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function mapPrismaTypeToSequelize(prismaType, isArray = false, fieldName = '') {
  // Check if it's an enum
  const enumExists = enums.find(e => e.name === prismaType);
  if (enumExists) {
    return `Sequelize.ENUM(${enumExists.values.map(v => `'${v}'`).join(', ')})`;
  }
  
  const typeMap = {
    'String': fieldName.endsWith('_id') || fieldName === 'id' ? 'Sequelize.UUID' : 'Sequelize.STRING',
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
  
  if (isArray && prismaType === 'String') {
    sqlType = 'Sequelize.ARRAY(Sequelize.STRING)';
  }
  
  return sqlType;
}

// Generate migration
const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
const migrationName = `${timestamp}-create-initial-schema.js`;

let migration = `'use strict';

/**
 * INITIAL SCHEMA MIGRATION
 * Generated from Prisma schema: ${new Date().toISOString()}
 * 
 * This migration creates all tables with their complete structure.
 * Run this migration first before any other migrations.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Creating initial database schema...\\n');
    
`;

// First create all enums if using PostgreSQL
if (enums.length > 0) {
  migration += `    // ========================================\n`;
  migration += `    // CREATE ENUMS\n`;
  migration += `    // ========================================\n`;
  for (const enumDef of enums) {
    migration += `    await queryInterface.sequelize.query(\`\n`;
    migration += `      CREATE TYPE "${enumDef.name}" AS ENUM (${enumDef.values.map(v => `'${v}'`).join(', ')});\n`;
    migration += `    \`);\n`;
    migration += `    console.log('  ✓ Created enum: ${enumDef.name}');\n\n`;
  }
  migration += `    \n`;
}

// Create all tables (Step 1: Create tables without foreign keys)
migration += `    // ========================================\n`;
migration += `    // CREATE TABLES (without foreign keys)\n`;
migration += `    // ========================================\n\n`;

for (const model of models) {
  migration += `    // ${model.name} → ${model.table}\n`;
  migration += `    await queryInterface.createTable('${model.table}', {\n`;
  
  for (const field of model.fields) {
    migration += `      ${field.column}: {\n`;
    migration += `        type: ${mapPrismaTypeToSequelize(field.type, field.isArray, field.column)},\n`;
    
    if (field.isId) {
      migration += `        primaryKey: true,\n`;
    }
    
    // Handle default values
    if (field.default === 'uuid()' || field.default === 'gen_random_uuid()') {
      migration += `        defaultValue: Sequelize.UUIDV4,\n`;
    } else if (field.default === 'now()' || field.default === 'CURRENT_TIMESTAMP' || field.isUpdatedAt) {
      migration += `        defaultValue: Sequelize.NOW,\n`;
    } else if (field.default === 'true') {
      migration += `        defaultValue: true,\n`;
    } else if (field.default === 'false') {
      migration += `        defaultValue: false,\n`;
    } else if (field.default && !isNaN(field.default)) {
      migration += `        defaultValue: ${field.default},\n`;
    } else if (field.default && field.default.startsWith('"')) {
      migration += `        defaultValue: ${field.default},\n`;
    } else if (field.default && field.default.includes('::')) {
      // PostgreSQL type cast like '0'::numeric
      const valueMatch = field.default.match(/'([^']+)'/);
      if (valueMatch) {
        migration += `        defaultValue: ${valueMatch[1]},\n`;
      }
    }
    
    if (!field.optional && !field.isId) {
      migration += `        allowNull: false,\n`;
    } else if (field.optional) {
      migration += `        allowNull: true,\n`;
    }
    
    if (field.unique) {
      migration += `        unique: true,\n`;
    }
    
    migration += `      },\n`;
  }
  
  // Add foreign key columns WITHOUT references (add them later)
  // Only add if not already in fields
  for (const relation of model.relations) {
    const existingField = model.fields.find(f => f.column === relation.column);
    if (!existingField) {
      migration += `      ${relation.column}: {\n`;
      migration += `        type: Sequelize.UUID,\n`;
      migration += `        allowNull: true,\n`;
      migration += `      },\n`;
    }
  }
  
  migration += `    });\n`;
  migration += `    console.log('  ✓ Created table: ${model.table}');\n\n`;
}

// Step 2: Add foreign key constraints
migration += `    // ========================================\n`;
migration += `    // ADD FOREIGN KEY CONSTRAINTS\n`;
migration += `    // ========================================\n\n`;

for (const model of models) {
  if (model.relations.length > 0) {
    migration += `    // Foreign keys for ${model.table}\n`;
    for (const relation of model.relations) {
      const refModel = models.find(m => m.name === relation.type);
      if (refModel) {
        migration += `    await queryInterface.addConstraint('${model.table}', {\n`;
        migration += `      fields: ['${relation.column}'],\n`;
        migration += `      type: 'foreign key',\n`;
        migration += `      name: '${model.table}_${relation.column}_fkey',\n`;
        migration += `      references: {\n`;
        migration += `        table: '${refModel.table}',\n`;
        migration += `        field: 'id',\n`;
        migration += `      },\n`;
        migration += `      onUpdate: 'CASCADE',\n`;
        migration += `      onDelete: 'SET NULL',\n`;
        migration += `    });\n`;
      }
    }
    migration += `    console.log('  ✓ Added foreign keys for: ${model.table}');\n\n`;
  }
}

migration += `    console.log('\\n✅ Initial schema created successfully!\\n');\n`;
migration += `  },\n\n`;

migration += `  async down(queryInterface, Sequelize) {\n`;
migration += `    console.log('⚠️  Dropping all tables...\\n');\n\n`;

// Drop tables in reverse order to avoid foreign key issues
for (let i = models.length - 1; i >= 0; i--) {
  const model = models[i];
  migration += `    await queryInterface.dropTable('${model.table}');\n`;
}

if (enums.length > 0) {
  migration += `\n    // Drop enums\n`;
  for (const enumDef of enums) {
    migration += `    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "${enumDef.name}";');\n`;
  }
}

migration += `\n    console.log('\\n✅ All tables dropped!\\n');\n`;
migration += `  }\n`;
migration += `};\n`;

// Save migration
const migrationsDir = path.join(__dirname, '..', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
  console.log('📁 Created migrations directory\n');
}

const migrationPath = path.join(migrationsDir, migrationName);
fs.writeFileSync(migrationPath, migration);

console.log('✅ Initial migration generated successfully!\n');
console.log(`📄 File: ${migrationName}\n`);
console.log(`📊 Summary:`);
console.log(`   - Enums: ${enums.length}`);
console.log(`   - Tables: ${models.length}`);
console.log(`   - Total fields: ${models.reduce((sum, m) => sum + m.fields.length, 0)}\n`);

console.log('🎯 To create the tables, run:');
console.log(`   npm run migrate\n`);

// Save summary
fs.writeFileSync(
  path.join(__dirname, '..', '..', 'initial-migration-summary.json'),
  JSON.stringify({ enums, models, timestamp, migrationName }, null, 2)
);
