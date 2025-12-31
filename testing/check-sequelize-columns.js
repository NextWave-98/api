const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Sequelize with your database configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

// Import all models from the compiled dist folder
async function loadModels() {
  try {
    // Import the models from compiled TypeScript
    const modelsIndex = require('./dist/models/index.js');
    
    // Initialize models if there's a register function
    if (modelsIndex.registerModels) {
      console.log('🔧 Initializing Sequelize models...');
      await modelsIndex.registerModels();
    }
    
    // Get all exported model instances
    const models = {};
    const skipKeys = ['registerModels', 'initializeAssociations', 'getAllModels', 
                     'sequelize', 'Sequelize', 'setupAssociations'];
    
    for (const [key, value] of Object.entries(modelsIndex)) {
      // Skip functions and enums
      if (skipKeys.includes(key)) continue;
      if (typeof value === 'string') continue; // Skip enum values
      
      // Check if it's a Sequelize model instance
      if (value && value.tableName && value.rawAttributes) {
        models[key] = value;
      }
    }

    console.log(`✅ Loaded ${Object.keys(models).length} models`);
    if (Object.keys(models).length > 0) {
      console.log(`   Models: ${Object.keys(models).slice(0, 5).join(', ')}...`);
    }
    console.log();
    return models;
  } catch (error) {
    console.error('❌ Error loading models:', error.message);
    console.error('   Make sure to compile TypeScript first: npm run build');
    console.error('   Stack:', error.stack);
    throw error;
  }
}

async function getActualDatabaseColumns() {
  const query = `
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `;

  const [results] = await sequelize.query(query);
  
  const tableColumns = {};
  for (const row of results) {
    if (!tableColumns[row.table_name]) {
      tableColumns[row.table_name] = [];
    }
    tableColumns[row.table_name].push({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      default: row.column_default,
      length: row.character_maximum_length
    });
  }

  return tableColumns;
}

function getModelColumns(model) {
  const columns = [];
  const attributes = model.rawAttributes;

  for (const [fieldName, field] of Object.entries(attributes)) {
    // Skip virtual fields and relation fields
    if (field.type && field.type.constructor.name !== 'VIRTUAL') {
      columns.push({
        name: field.field || fieldName,
        type: field.type.constructor.name,
        allowNull: field.allowNull !== false,
        defaultValue: field.defaultValue,
        primaryKey: field.primaryKey || false,
        unique: field.unique || false,
        references: field.references || null
      });
    }
  }

  return columns;
}

async function checkMissingColumns() {
  try {
    console.log('🔍 Checking for missing columns between Sequelize models and database...\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Load models
    const models = await loadModels();

    // Get actual database columns
    const dbColumns = await getActualDatabaseColumns();
    console.log(`✅ Found ${Object.keys(dbColumns).length} tables in database\n`);

    const missingColumns = [];
    const extraColumns = [];
    const mismatchedTypes = [];

    // Compare each model with database
    for (const [modelName, model] of Object.entries(models)) {
      const tableName = model.tableName;
      
      if (!dbColumns[tableName]) {
        console.log(`⚠️  Table "${tableName}" (model: ${modelName}) does not exist in database\n`);
        continue;
      }

      const modelColumns = getModelColumns(model);
      const dbTableColumns = dbColumns[tableName].map(c => c.name);

      // Check for missing columns (in model but not in DB)
      for (const modelCol of modelColumns) {
        if (!dbTableColumns.includes(modelCol.name)) {
          missingColumns.push({
            table: tableName,
            model: modelName,
            column: modelCol.name,
            type: modelCol.type,
            allowNull: modelCol.allowNull,
            defaultValue: modelCol.defaultValue,
            primaryKey: modelCol.primaryKey,
            unique: modelCol.unique,
            references: modelCol.references
          });
        }
      }

      // Check for extra columns (in DB but not in model)
      for (const dbCol of dbColumns[tableName]) {
        const modelColNames = modelColumns.map(c => c.name);
        if (!modelColNames.includes(dbCol.name)) {
          extraColumns.push({
            table: tableName,
            column: dbCol.name,
            type: dbCol.type
          });
        }
      }
    }

    // Display results
    console.log('=' .repeat(80));
    console.log('📊 COLUMN COMPARISON RESULTS');
    console.log('='.repeat(80));
    console.log();

    if (missingColumns.length > 0) {
      console.log(`❌ MISSING COLUMNS IN DATABASE (${missingColumns.length} columns):`);
      console.log('─'.repeat(80));
      
      const groupedByTable = {};
      for (const col of missingColumns) {
        if (!groupedByTable[col.table]) {
          groupedByTable[col.table] = [];
        }
        groupedByTable[col.table].push(col);
      }

      for (const [table, columns] of Object.entries(groupedByTable)) {
        console.log(`\n📋 Table: ${table} (${columns.length} missing columns)`);
        for (const col of columns) {
          console.log(`   - ${col.column} (${col.type})`);
          console.log(`     Nullable: ${col.allowNull}, Default: ${col.defaultValue || 'none'}`);
          if (col.references) {
            console.log(`     References: ${col.references.model}.${col.references.key}`);
          }
        }
      }
      console.log();
    } else {
      console.log('✅ No missing columns found!\n');
    }

    if (extraColumns.length > 0) {
      console.log(`ℹ️  EXTRA COLUMNS IN DATABASE (${extraColumns.length} columns - not in Sequelize models):`);
      console.log('─'.repeat(80));
      
      const groupedByTable = {};
      for (const col of extraColumns) {
        if (!groupedByTable[col.table]) {
          groupedByTable[col.table] = [];
        }
        groupedByTable[col.table].push(col);
      }

      for (const [table, columns] of Object.entries(groupedByTable)) {
        console.log(`\n📋 Table: ${table}`);
        for (const col of columns) {
          console.log(`   - ${col.column} (${col.type})`);
        }
      }
      console.log();
    }

    // Generate SQL to add missing columns
    if (missingColumns.length > 0) {
      console.log('='.repeat(80));
      console.log('📝 SQL TO ADD MISSING COLUMNS');
      console.log('='.repeat(80));
      console.log();

      const sqlStatements = [];
      
      for (const col of missingColumns) {
        let dataType = mapSequelizeTypeToSQL(col.type);
        let nullable = col.allowNull ? 'NULL' : 'NOT NULL';
        let defaultVal = '';
        
        if (col.defaultValue !== undefined && col.defaultValue !== null) {
          if (typeof col.defaultValue === 'boolean') {
            defaultVal = ` DEFAULT ${col.defaultValue}`;
          } else if (typeof col.defaultValue === 'number') {
            defaultVal = ` DEFAULT ${col.defaultValue}`;
          } else if (col.defaultValue.toString().includes('UUIDV4')) {
            defaultVal = ` DEFAULT gen_random_uuid()`;
          } else if (col.defaultValue.toString().includes('NOW')) {
            defaultVal = ` DEFAULT CURRENT_TIMESTAMP`;
          } else {
            defaultVal = ` DEFAULT '${col.defaultValue}'`;
          }
        }

        const sql = `ALTER TABLE "${col.table}" ADD COLUMN "${col.column}" ${dataType} ${nullable}${defaultVal};`;
        sqlStatements.push(sql);
        console.log(sql);
      }

      // Save SQL to file
      const sqlFile = path.join(__dirname, 'add-missing-columns-sequelize.sql');
      fs.writeFileSync(sqlFile, sqlStatements.join('\n'));
      console.log(`\n✅ SQL saved to: ${sqlFile}\n`);
    }

    // Save full report to JSON
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalModels: Object.keys(models).length,
        totalTables: Object.keys(dbColumns).length,
        missingColumns: missingColumns.length,
        extraColumns: extraColumns.length
      },
      missingColumns,
      extraColumns
    };

    const reportFile = path.join(__dirname, 'sequelize-columns-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved to: ${reportFile}\n`);

    console.log('='.repeat(80));
    console.log('✨ Column check completed!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

function mapSequelizeTypeToSQL(sequelizeType) {
  const typeMap = {
    'STRING': 'VARCHAR(255)',
    'TEXT': 'TEXT',
    'INTEGER': 'INTEGER',
    'BIGINT': 'BIGINT',
    'FLOAT': 'FLOAT',
    'DOUBLE': 'DOUBLE PRECISION',
    'DECIMAL': 'DECIMAL(10,2)',
    'DATE': 'TIMESTAMP',
    'DATEONLY': 'DATE',
    'BOOLEAN': 'BOOLEAN',
    'UUID': 'UUID',
    'JSON': 'JSON',
    'JSONB': 'JSONB',
    'ENUM': 'VARCHAR(50)',
    'ARRAY': 'TEXT[]'
  };

  return typeMap[sequelizeType] || 'VARCHAR(255)';
}

// Run the check
checkMissingColumns();
