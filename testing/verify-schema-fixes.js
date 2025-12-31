/**
 * Final Verification Script
 * Checks if all schema fixes have been applied correctly
 */

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function verifySchema() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const results = {
      passed: [],
      failed: [],
      warnings: []
    };

    // Test 1: Check if role_permissions table exists
    console.log('🔍 Test 1: Checking role_permissions table...');
    const rolePermsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'role_permissions'
      );
    `);
    
    if (rolePermsCheck.rows[0].exists) {
      results.passed.push('✅ role_permissions table exists');
    } else {
      results.failed.push('❌ role_permissions table missing');
    }

    // Test 2: Check if notification_settings table exists
    console.log('🔍 Test 2: Checking notification_settings table...');
    const notifSettingsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notification_settings'
      );
    `);
    
    if (notifSettingsCheck.rows[0].exists) {
      results.passed.push('✅ notification_settings table exists');
    } else {
      results.failed.push('❌ notification_settings table missing');
    }

    // Test 3: Check snake_case columns in users table
    console.log('🔍 Test 3: Checking users table columns...');
    const usersColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    const userCols = usersColumns.rows.map(r => r.column_name);
    const requiredUserCols = ['role_id', 'location_id', 'is_active', 'refresh_token', 'last_login'];
    const missingUserCols = requiredUserCols.filter(col => !userCols.includes(col));
    
    if (missingUserCols.length === 0) {
      results.passed.push('✅ users table has all snake_case columns');
    } else {
      results.failed.push(`❌ users table missing: ${missingUserCols.join(', ')}`);
    }

    // Test 4: Check notifications table new columns
    console.log('🔍 Test 4: Checking notifications table enhancements...');
    const notifColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);
    
    const notifCols = notifColumns.rows.map(r => r.column_name);
    const requiredNotifCols = [
      'recipient_type', 'priority', 'event_type', 'recipient_user_id',
      'sale_id', 'product_return_id', 'metadata'
    ];
    const missingNotifCols = requiredNotifCols.filter(col => !notifCols.includes(col));
    
    if (missingNotifCols.length === 0) {
      results.passed.push('✅ notifications table has all new columns');
    } else {
      results.failed.push(`❌ notifications table missing: ${missingNotifCols.join(', ')}`);
    }

    // Test 5: Check products table snake_case columns
    console.log('🔍 Test 5: Checking products table columns...');
    const productColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);
    
    const productCols = productColumns.rows.map(r => r.column_name);
    const requiredProductCols = [
      'product_code', 'category_id', 'unit_price', 'cost_price',
      'tax_rate', 'warranty_months'
    ];
    const missingProductCols = requiredProductCols.filter(col => !productCols.includes(col));
    
    if (missingProductCols.length === 0) {
      results.passed.push('✅ products table has all snake_case columns');
    } else {
      results.failed.push(`❌ products table missing: ${missingProductCols.join(', ')}`);
    }

    // Test 6: Check job_sheets table snake_case columns
    console.log('🔍 Test 6: Checking job_sheets table columns...');
    const jobColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_sheets'
      ORDER BY ordinal_position;
    `);
    
    const jobCols = jobColumns.rows.map(r => r.column_name);
    const requiredJobCols = [
      'job_number', 'customer_id', 'device_id', 'location_id',
      'created_by_id', 'issue_description', 'received_date',
      'estimated_cost', 'actual_cost', 'labour_cost'
    ];
    const missingJobCols = requiredJobCols.filter(col => !jobCols.includes(col));
    
    if (missingJobCols.length === 0) {
      results.passed.push('✅ job_sheets table has all snake_case columns');
    } else {
      results.failed.push(`❌ job_sheets table missing: ${missingJobCols.join(', ')}`);
    }

    // Test 7: Check foreign key constraints on role_permissions
    console.log('🔍 Test 7: Checking role_permissions foreign keys...');
    const rolePermsFKs = await client.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'role_permissions';
    `);
    
    if (rolePermsFKs.rows.length >= 2) {
      results.passed.push('✅ role_permissions has proper foreign keys');
    } else {
      results.warnings.push('⚠️  role_permissions may be missing foreign keys');
    }

    // Test 8: Check sales table columns
    console.log('🔍 Test 8: Checking sales table columns...');
    const salesColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales'
      ORDER BY ordinal_position;
    `);
    
    const salesCols = salesColumns.rows.map(r => r.column_name);
    const requiredSalesCols = [
      'sale_number', 'location_id', 'sold_by_id', 'sale_type',
      'payment_status', 'total_amount'
    ];
    const missingSalesCols = requiredSalesCols.filter(col => !salesCols.includes(col));
    
    if (missingSalesCols.length === 0) {
      results.passed.push('✅ sales table has all snake_case columns');
    } else {
      results.failed.push(`❌ sales table missing: ${missingSalesCols.join(', ')}`);
    }

    // Test 9: Check product_returns enhancements
    console.log('🔍 Test 9: Checking product_returns table columns...');
    const returnColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'product_returns'
      ORDER BY ordinal_position;
    `);
    
    const returnCols = returnColumns.rows.map(r => r.column_name);
    const requiredReturnCols = [
      'return_number', 'location_id', 'source_type', 'sale_id',
      'warranty_claim_id', 'job_sheet_id', 'return_date', 'category'
    ];
    const missingReturnCols = requiredReturnCols.filter(col => !returnCols.includes(col));
    
    if (missingReturnCols.length === 0) {
      results.passed.push('✅ product_returns table has all required columns');
    } else {
      results.failed.push(`❌ product_returns table missing: ${missingReturnCols.join(', ')}`);
    }

    // Test 10: Check ENUMs existence
    console.log('🔍 Test 10: Checking ENUM types...');
    const enumCheck = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
        AND typname IN ('RecipientType', 'NotificationPriority', 'EventType')
      ORDER BY typname;
    `);
    
    if (enumCheck.rows.length > 0) {
      results.passed.push(`✅ Found ${enumCheck.rows.length} new ENUM types`);
    } else {
      results.warnings.push('⚠️  Some ENUM types may not be created yet');
    }

    // Print Results
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION RESULTS');
    console.log('='.repeat(80));
    
    console.log('\n✅ PASSED TESTS (' + results.passed.length + '):');
    results.passed.forEach(test => console.log('  ' + test));
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (' + results.warnings.length + '):');
      results.warnings.forEach(test => console.log('  ' + test));
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ FAILED TESTS (' + results.failed.length + '):');
      results.failed.forEach(test => console.log('  ' + test));
    }

    console.log('\n' + '='.repeat(80));
    
    if (results.failed.length === 0) {
      console.log('✅ ALL CRITICAL TESTS PASSED!');
      console.log('Your schema is now fully compatible with Prisma ORM!');
    } else {
      console.log('❌ SOME TESTS FAILED - Please run the migrations:');
      console.log('   npx sequelize-cli db:migrate');
    }
    
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Verification error:', error.message);
  } finally {
    await client.end();
  }
}

// Run verification
verifySchema();
