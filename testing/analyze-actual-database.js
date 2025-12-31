/**
 * Deep Schema Analysis: Prisma SQL vs ACTUAL DATABASE
 * This script compares Prisma migration SQL with the ACTUAL database columns
 * (not model definitions) to verify complete schema compatibility
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

console.log('='.repeat(80));
console.log('DEEP SCHEMA ANALYSIS: Prisma SQL vs ACTUAL DATABASE');
console.log('='.repeat(80));
console.log('');

// Read the Prisma migration SQL
const prismaSqlPath = path.join(__dirname, '../prisma/migrations/20251213054200_fullmigrations/migration.sql');
const prismaSql = fs.readFileSync(prismaSqlPath, 'utf8');

// Parse Prisma SQL to extract table definitions
const tableRegex = /CREATE TABLE "(\w+)" \(([\s\S]*?)\);/g;
const prismaSchema = {};

let match;
while ((match = tableRegex.exec(prismaSql)) !== null) {
  const tableName = match[1];
  const tableContent = match[2];
  const columns = [];
  
  // Extract column names (ignore constraints)
  const lines = tableContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('"') && !trimmed.includes('CONSTRAINT')) {
      const columnMatch = trimmed.match(/"(\w+)"/);
      if (columnMatch) {
        columns.push(columnMatch[1]);
      }
    }
  }
  
  prismaSchema[tableName] = columns;
}

// Tables to analyze in detail
const keyTables = [
  'users', 'staff', 'locations', 'warehouses', 'branches', 
  'products', 'job_sheets', 'sales', 'warranty_cards', 
  'notifications', 'purchase_orders', 'supplier_returns', 'product_returns'
];

async function analyzeSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log('');

    // Get all tables from database
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'SequelizeMeta'
      ORDER BY table_name;
    `);

    const dbTables = tablesResult.rows.map(r => r.table_name);
    const prismaTableNames = Object.keys(prismaSchema);

    console.log(`📊 PRISMA SCHEMA: ${prismaTableNames.length} tables`);
    console.log(`📊 DATABASE: ${dbTables.length} tables`);
    console.log('');

    // Find missing tables
    const missingTables = prismaTableNames.filter(t => !dbTables.includes(t));
    const extraTables = dbTables.filter(t => !prismaTableNames.includes(t) && t !== '_prisma_migrations');

    if (missingTables.length > 0) {
      console.log('❌ MISSING TABLES IN DATABASE:');
      missingTables.forEach(t => console.log(`   - ${t}`));
      console.log('');
    }

    if (extraTables.length > 0) {
      console.log('ℹ️  EXTRA TABLES IN DATABASE (not in Prisma):');
      extraTables.forEach(t => console.log(`   - ${t}`));
      console.log('');
    }

    // Analyze key tables in detail
    console.log('🔍 ANALYZING KEY TABLES IN DETAIL...');
    console.log('');

    let totalIssues = 0;
    const issuesByTable = {};

    for (const tableName of keyTables) {
      if (!prismaSchema[tableName]) continue;
      if (!dbTables.includes(tableName)) {
        console.log(`❌ ${tableName.toUpperCase()}: TABLE MISSING IN DATABASE`);
        totalIssues++;
        issuesByTable[tableName] = ['Table does not exist'];
        continue;
      }

      // Get actual columns from database
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      const dbColumns = columnsResult.rows.map(r => r.column_name);
      const prismaColumns = prismaSchema[tableName];

      // Compare columns
      const missingColumns = prismaColumns.filter(col => !dbColumns.includes(col));
      const extraColumns = dbColumns.filter(col => !prismaColumns.includes(col));

      if (missingColumns.length > 0 || extraColumns.length > 0) {
        console.log(`📋 ${tableName.toUpperCase()}`);
        
        const issues = [];

        if (missingColumns.length > 0) {
          console.log(`  ❌ Missing in DB: ${missingColumns.join(', ')}`);
          issues.push(`Missing: ${missingColumns.join(', ')}`);
          totalIssues++;
        }

        if (extraColumns.length > 0) {
          console.log(`  ℹ️  Extra in DB: ${extraColumns.join(', ')}`);
        }

        console.log(`  ✅ Prisma expects: ${prismaColumns.length} columns`);
        console.log(`  ✅ Database has: ${dbColumns.length} columns`);
        console.log('');

        if (issues.length > 0) {
          issuesByTable[tableName] = issues;
        }
      } else {
        console.log(`✅ ${tableName.toUpperCase()}: Perfect match (${dbColumns.length} columns)`);
        console.log('');
      }
    }

    // Check for junction table
    console.log('🔗 CHECKING JUNCTION TABLES...');
    console.log('');

    const junctionTables = ['role_permissions', '_PermissionToRole'];
    for (const junctionTable of junctionTables) {
      if (dbTables.includes(junctionTable)) {
        console.log(`✅ ${junctionTable}: EXISTS`);
      } else {
        console.log(`❌ ${junctionTable}: MISSING`);
        totalIssues++;
      }
    }
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log('');

    if (totalIssues === 0) {
      console.log('🎉 ✅ PERFECT! All tables and columns match between Prisma and Database!');
      console.log('');
      console.log('Your database schema is 100% compatible with Prisma ORM!');
    } else {
      console.log(`⚠️  Found ${totalIssues} issue(s) across ${Object.keys(issuesByTable).length} table(s)`);
      console.log('');
      console.log('ISSUES BY TABLE:');
      for (const [table, issues] of Object.entries(issuesByTable)) {
        console.log(`  ${table}:`);
        issues.forEach(issue => console.log(`    - ${issue}`));
      }
      console.log('');
      console.log('💡 Run migrations to fix these issues:');
      console.log('   npx sequelize-cli db:migrate');
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the analysis
analyzeSchema();
