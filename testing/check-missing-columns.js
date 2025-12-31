/**
 * Check which columns are actually missing from tables
 */

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function checkMissingColumns() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check notifications table
    console.log('🔍 NOTIFICATIONS TABLE:');
    const notifColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);
    console.log('Current columns:', notifColumns.rows.map(r => r.column_name).join(', '));
    console.log('Expected missing: sale_id, product_return_id\n');

    // Check job_sheets table
    console.log('🔍 JOB_SHEETS TABLE:');
    const jobColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'job_sheets'
      ORDER BY ordinal_position;
    `);
    console.log('Current columns:', jobColumns.rows.map(r => r.column_name).join(', '));
    console.log('Expected missing: job_number, created_by_id, received_date, actual_cost, labour_cost\n');

    // Check sales table
    console.log('🔍 SALES TABLE:');
    const salesColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'sales'
      ORDER BY ordinal_position;
    `);
    console.log('Current columns:', salesColumns.rows.map(r => r.column_name).join(', '));
    console.log('Expected missing: sold_by_id, sale_type\n');

    // Check product_returns table
    console.log('🔍 PRODUCT_RETURNS TABLE:');
    const returnColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'product_returns'
      ORDER BY ordinal_position;
    `);
    console.log('Current columns:', returnColumns.rows.map(r => r.column_name).join(', '));
    console.log('Expected missing: source_type, warranty_claim_id, job_sheet_id, category\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkMissingColumns();
