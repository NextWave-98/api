const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

// Parse Prisma schema to extract column information
function parsePrismaSchema() {
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  const models = {};
  const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
  let match;
  
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1];
    const modelContent = match[2];
    
    // Get table name from @@map
    const mapMatch = modelContent.match(/@@map\("([^"]+)"\)/);
    const tableName = mapMatch ? mapMatch[1] : modelName.toLowerCase() + 's';
    
    // Extract fields
    const fields = [];
    const fieldLines = modelContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('@@'));
    
    for (const line of fieldLines) {
      // Match field definitions: name Type @attributes
      const fieldMatch = line.match(/^\s*(\w+)\s+(\w+[\?\[\]]*)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        
        // Skip relation fields (they don't have database columns)
        if (line.includes('@relation')) continue;
        
        // Get database column name from @map or use camelCase to snake_case
        const mapFieldMatch = line.match(/@map\("([^"]+)"\)/);
        const dbColumnName = mapFieldMatch ? mapFieldMatch[1] : camelToSnake(fieldName);
        
        // Check if field is optional
        const isOptional = fieldType.includes('?');
        
        // Get default value
        const defaultMatch = line.match(/@default\(([^)]+)\)/);
        const defaultValue = defaultMatch ? defaultMatch[1] : null;
        
        fields.push({
          name: fieldName,
          column: dbColumnName,
          type: fieldType.replace(/[\?\[\]]/g, ''),
          optional: isOptional,
          default: defaultValue
        });
      }
    }
    
    models[modelName] = {
      table: tableName,
      fields
    };
  }
  
  return models;
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

async function checkMissingColumns() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');
    
    // Parse Prisma schema
    console.log('📖 Parsing Prisma schema...\n');
    const prismaModels = parsePrismaSchema();
    console.log(`Found ${Object.keys(prismaModels).length} models in Prisma schema\n`);
    
    const results = {
      missingColumns: [],
      missingTables: [],
      extraColumns: []
    };
    
    // Check each model
    for (const [modelName, modelInfo] of Object.entries(prismaModels)) {
      const tableName = modelInfo.table;
      
      console.log(`\nChecking: ${modelName} → ${tableName}`);
      console.log('-'.repeat(60));
      
      // Check if table exists
      const [tableExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        );
      `);
      
      if (!tableExists[0].exists) {
        console.log(`❌ TABLE MISSING: ${tableName}`);
        results.missingTables.push({ model: modelName, table: tableName });
        continue;
      }
      
      // Get actual database columns
      const [dbColumns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
        ORDER BY ordinal_position
      `);
      
      const dbColumnNames = dbColumns.map(c => c.column_name);
      
      // Check for missing columns
      let missingCount = 0;
      for (const field of modelInfo.fields) {
        if (!dbColumnNames.includes(field.column)) {
          console.log(`  ❌ Missing: ${field.column} (${field.type})`);
          missingCount++;
          
          results.missingColumns.push({
            model: modelName,
            table: tableName,
            field: field.name,
            column: field.column,
            type: field.type,
            optional: field.optional,
            default: field.default
          });
        }
      }
      
      if (missingCount === 0) {
        console.log(`  ✓ All ${modelInfo.fields.length} columns present`);
      } else {
        console.log(`  Found ${dbColumnNames.length} columns, missing ${missingCount}`);
      }
    }
    
    // Print summary
    console.log('\n\n' + '='.repeat(80));
    console.log('MISSING COLUMNS SUMMARY');
    console.log('='.repeat(80));
    
    if (results.missingTables.length > 0) {
      console.log(`\n❌ Missing Tables: ${results.missingTables.length}`);
      results.missingTables.forEach(item => {
        console.log(`   • ${item.model} → ${item.table}`);
      });
    }
    
    if (results.missingColumns.length > 0) {
      console.log(`\n❌ Missing Columns: ${results.missingColumns.length}`);
      
      // Group by table
      const byTable = {};
      results.missingColumns.forEach(item => {
        if (!byTable[item.table]) byTable[item.table] = [];
        byTable[item.table].push(item);
      });
      
      Object.entries(byTable).forEach(([table, columns]) => {
        console.log(`\n   📋 ${table}:`);
        columns.forEach(col => {
          console.log(`      • ${col.column} (${col.type}) ${col.optional ? 'NULL' : 'NOT NULL'}`);
        });
      });
      
      // Generate migration SQL
      console.log('\n\n' + '='.repeat(80));
      console.log('MIGRATION SQL TO FIX MISSING COLUMNS');
      console.log('='.repeat(80));
      console.log('\n-- Run this SQL to add missing columns:\n');
      
      Object.entries(byTable).forEach(([table, columns]) => {
        console.log(`\n-- ${table}`);
        columns.forEach(col => {
          const sqlType = mapPrismaToSQL(col.type);
          const nullable = col.optional ? '' : ' NOT NULL';
          let defaultVal = '';
          
          if (col.default) {
            if (col.default === 'now()' || col.default === 'CURRENT_TIMESTAMP') {
              defaultVal = ' DEFAULT CURRENT_TIMESTAMP';
            } else if (col.default === 'uuid()' || col.default === 'gen_random_uuid()') {
              defaultVal = ' DEFAULT gen_random_uuid()';
            } else if (col.default === 'true' || col.default === 'false') {
              defaultVal = ` DEFAULT ${col.default}`;
            } else if (!isNaN(col.default)) {
              defaultVal = ` DEFAULT ${col.default}`;
            } else {
              defaultVal = ` DEFAULT '${col.default}'`;
            }
          }
          
          console.log(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col.column} ${sqlType}${nullable}${defaultVal};`);
        });
      });
      
      // Save SQL to file
      const sqlContent = Object.entries(byTable).map(([table, columns]) => {
        return `-- ${table}\n` + columns.map(col => {
          const sqlType = mapPrismaToSQL(col.type);
          const nullable = col.optional ? '' : ' NOT NULL';
          let defaultVal = '';
          
          if (col.default) {
            if (col.default === 'now()' || col.default === 'CURRENT_TIMESTAMP') {
              defaultVal = ' DEFAULT CURRENT_TIMESTAMP';
            } else if (col.default === 'uuid()' || col.default === 'gen_random_uuid()') {
              defaultVal = ' DEFAULT gen_random_uuid()';
            } else if (col.default === 'true' || col.default === 'false') {
              defaultVal = ` DEFAULT ${col.default}`;
            } else if (!isNaN(col.default)) {
              defaultVal = ` DEFAULT ${col.default}`;
            } else {
              defaultVal = ` DEFAULT '${col.default}'`;
            }
          }
          
          return `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col.column} ${sqlType}${nullable}${defaultVal};`;
        }).join('\n');
      }).join('\n\n');
      
      const sqlPath = path.join(__dirname, 'fix-missing-columns.sql');
      fs.writeFileSync(sqlPath, '-- Auto-generated SQL to fix missing columns\n\n' + sqlContent);
      console.log(`\n\n📄 SQL saved to: fix-missing-columns.sql`);
    } else {
      console.log('\n✅ No missing columns found!');
    }
    
    // Save JSON report
    const reportPath = path.join(__dirname, 'missing-columns-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📄 JSON report saved to: missing-columns-report.json`);
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function mapPrismaToSQL(prismaType) {
  const mapping = {
    'String': 'VARCHAR(255)',
    'Int': 'INTEGER',
    'BigInt': 'BIGINT',
    'Float': 'DOUBLE PRECISION',
    'Decimal': 'DECIMAL(12,2)',
    'Boolean': 'BOOLEAN',
    'DateTime': 'TIMESTAMP WITH TIME ZONE',
    'Json': 'JSONB',
    'Bytes': 'BYTEA'
  };
  return mapping[prismaType] || 'TEXT';
}

checkMissingColumns();
