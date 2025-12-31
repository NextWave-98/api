const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

// Import all models - need to compile TypeScript first or use direct import
// For now, we'll load them dynamically
async function loadModels() {
  const modelFiles = [
    'user.model',
    'role.model',
    'permission.model',
    'location.model',
    'customer.model',
    'product.model',
    'product-category.model',
    'jobsheet.model',
    'payment.model',
    'sale.model',
    'sale-item.model',
    'sale-payment.model',
    'sale-refund.model',
    'purchase-order.model',
    'purchase-order-item.model',
    'supplier.model',
    'supplier-payment.model',
    'warehouse.model',
    'stock-transfer.model',
    'stock-transfer-item.model',
    'product-inventory.model',
    'stock-movement.model',
    'product-return.model',
  ];

  const models = {};
  for (const file of modelFiles) {
    try {
      const module = require(`./src/models/${file}`);
      const modelName = Object.keys(module)[0];
      if (modelName && module[modelName]) {
        models[modelName] = module[modelName];
      }
    } catch (err) {
      // Model file doesn't exist or has error, skip
    }
  }
  return models;
}

async function checkAllMissingColumns() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    const results = {
      missingColumns: [],
      missingTables: [],
      mismatchedTypes: [],
      summary: {}
    };

    // Load models
    const models = await loadModels();
    console.log(`Loaded ${Object.keys(models).length} models\n`);

    // Get all tables in database
    const [dbTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const dbTableNames = dbTables.map(t => t.table_name);
    console.log(`Found ${dbTableNames.length} tables in database\n`);

    // Check each model
    for (const [modelName, Model] of Object.entries(models)) {
      if (!Model.tableName || !Model.rawAttributes) continue;

      const tableName = Model.tableName;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Checking: ${modelName} (${tableName})`);
      console.log('='.repeat(60));

      // Check if table exists
      if (!dbTableNames.includes(tableName)) {
        console.log(`❌ TABLE MISSING: ${tableName}`);
        results.missingTables.push({
          model: modelName,
          table: tableName
        });
        continue;
      }

      // Get table columns from database
      const [dbColumns] = await sequelize.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
        ORDER BY ordinal_position
      `);

      const dbColumnNames = dbColumns.map(c => c.column_name);
      const modelAttributes = Object.keys(Model.rawAttributes);

      console.log(`\nDatabase columns (${dbColumnNames.length}):`, dbColumnNames.slice(0, 5).join(', '), '...');
      console.log(`Model attributes (${modelAttributes.length}):`, modelAttributes.slice(0, 5).join(', '), '...');

      // Check each model attribute
      for (const attr of modelAttributes) {
        const attrConfig = Model.rawAttributes[attr];
        const fieldName = attrConfig.field || attr;

        // Check if column exists in database
        if (!dbColumnNames.includes(fieldName)) {
          console.log(`\n❌ MISSING COLUMN: ${fieldName}`);
          console.log(`   Model attribute: ${attr}`);
          console.log(`   Expected type: ${attrConfig.type.key || attrConfig.type}`);
          console.log(`   Nullable: ${attrConfig.allowNull !== false}`);
          
          results.missingColumns.push({
            model: modelName,
            table: tableName,
            attribute: attr,
            field: fieldName,
            type: attrConfig.type.key || attrConfig.type.constructor.name,
            allowNull: attrConfig.allowNull !== false,
            defaultValue: attrConfig.defaultValue
          });
        } else {
          // Column exists - check for type mismatches
          const dbColumn = dbColumns.find(c => c.column_name === fieldName);
          const modelType = (attrConfig.type.key || attrConfig.type.constructor.name).toUpperCase();
          const dbType = dbColumn.data_type.toUpperCase();

          // Basic type mapping for comparison
          const typeMapping = {
            'STRING': ['CHARACTER VARYING', 'VARCHAR', 'TEXT'],
            'TEXT': ['TEXT', 'CHARACTER VARYING'],
            'INTEGER': ['INTEGER', 'SMALLINT', 'BIGINT'],
            'BIGINT': ['BIGINT', 'INTEGER'],
            'DECIMAL': ['NUMERIC', 'DECIMAL'],
            'BOOLEAN': ['BOOLEAN'],
            'DATE': ['TIMESTAMP WITH TIME ZONE', 'TIMESTAMP WITHOUT TIME ZONE', 'DATE'],
            'UUID': ['UUID'],
            'JSONB': ['JSONB', 'JSON'],
            'JSON': ['JSON', 'JSONB'],
            'ENUM': ['USER-DEFINED']
          };

          const expectedTypes = typeMapping[modelType] || [modelType];
          if (!expectedTypes.includes(dbType)) {
            console.log(`\n⚠️  TYPE MISMATCH: ${fieldName}`);
            console.log(`   Model expects: ${modelType}`);
            console.log(`   Database has: ${dbType}`);
            
            results.mismatchedTypes.push({
              model: modelName,
              table: tableName,
              field: fieldName,
              modelType,
              dbType
            });
          }
        }
      }

      console.log(`\n✓ Checked ${modelAttributes.length} attributes`);
    }

    // Print summary
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('SUMMARY REPORT');
    console.log('='.repeat(80));

    console.log(`\n📊 Missing Tables: ${results.missingTables.length}`);
    if (results.missingTables.length > 0) {
      results.missingTables.forEach(item => {
        console.log(`   • ${item.model} → ${item.table}`);
      });
    }

    console.log(`\n📊 Missing Columns: ${results.missingColumns.length}`);
    if (results.missingColumns.length > 0) {
      // Group by table
      const byTable = {};
      results.missingColumns.forEach(item => {
        if (!byTable[item.table]) byTable[item.table] = [];
        byTable[item.table].push(item);
      });

      Object.entries(byTable).forEach(([table, columns]) => {
        console.log(`\n   Table: ${table}`);
        columns.forEach(col => {
          console.log(`      • ${col.field} (${col.type}) - ${col.allowNull ? 'NULL' : 'NOT NULL'}`);
        });
      });
    }

    console.log(`\n📊 Type Mismatches: ${results.mismatchedTypes.length}`);
    if (results.mismatchedTypes.length > 0) {
      results.mismatchedTypes.forEach(item => {
        console.log(`   • ${item.table}.${item.field}: ${item.modelType} vs ${item.dbType}`);
      });
    }

    // Generate migration SQL
    if (results.missingColumns.length > 0) {
      console.log('\n\n');
      console.log('='.repeat(80));
      console.log('MIGRATION SQL');
      console.log('='.repeat(80));
      console.log('\n-- Add missing columns\n');

      const byTable = {};
      results.missingColumns.forEach(item => {
        if (!byTable[item.table]) byTable[item.table] = [];
        byTable[item.table].push(item);
      });

      Object.entries(byTable).forEach(([table, columns]) => {
        console.log(`-- Table: ${table}`);
        columns.forEach(col => {
          const sqlType = mapSequelizeToSQLType(col.type);
          const nullable = col.allowNull ? '' : ' NOT NULL';
          const defaultVal = col.defaultValue ? ` DEFAULT ${formatDefaultValue(col.defaultValue)}` : '';
          
          console.log(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col.field} ${sqlType}${nullable}${defaultVal};`);
        });
        console.log('');
      });
    }

    // Save results to file
    const reportPath = path.join(__dirname, 'missing-columns-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function mapSequelizeToSQLType(type) {
  const mapping = {
    'STRING': 'VARCHAR(255)',
    'TEXT': 'TEXT',
    'INTEGER': 'INTEGER',
    'BIGINT': 'BIGINT',
    'DECIMAL': 'DECIMAL(10,2)',
    'BOOLEAN': 'BOOLEAN',
    'DATE': 'TIMESTAMP WITH TIME ZONE',
    'UUID': 'UUID',
    'JSONB': 'JSONB',
    'JSON': 'JSON',
    'ENUM': 'VARCHAR(50)' // Simplified for enum
  };
  return mapping[type] || 'TEXT';
}

function formatDefaultValue(value) {
  if (typeof value === 'string') {
    if (value.includes('()')) return value; // Function like uuid_generate_v4()
    return `'${value}'`;
  }
  if (typeof value === 'boolean') return value.toString().toUpperCase();
  if (value === null) return 'NULL';
  return value;
}

checkAllMissingColumns();
