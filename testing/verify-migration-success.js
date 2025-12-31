/**
 * Verification script to confirm the Prisma-to-Sequelize migration was successful
 * Run with: node verify-migration-success.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  }
);

const tests = [
  {
    name: 'SaleType enum includes DIRECT',
    query: `SELECT enumlabel FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'enum_sales_sale_type' 
            AND enumlabel = 'DIRECT'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'SaleType enum includes PHONE',
    query: `SELECT enumlabel FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'enum_sales_sale_type' 
            AND enumlabel = 'PHONE'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'ReferenceType enum includes TRANSFER',
    query: `SELECT enumlabel FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'enum_product_stock_movements_reference_type' 
            AND enumlabel = 'TRANSFER'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has customer_name column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'customer_name'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has customer_phone column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'customer_phone'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has customer_email column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'customer_email'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has sale_channel column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'sale_channel'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has subtotal column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'subtotal'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has discount column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'discount'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has discount_type column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'discount_type'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has discount_reason column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'discount_reason'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has tax column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'tax'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has tax_rate column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'tax_rate'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has payment_method column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'payment_method'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has payment_reference column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'payment_reference'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has invoice_url column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'invoice_url'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has completed_at column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'completed_at'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales table has cancelled_at column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'cancelled_at'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Sales customer_phone index exists',
    query: `SELECT indexname FROM pg_indexes 
            WHERE tablename = 'sales' AND indexname = 'sales_customer_phone_idx'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Products table has terms column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'terms'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Products table has coverage column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'coverage'`,
    expect: (result) => result.length === 1,
  },
  {
    name: 'Products table has exclusions column',
    query: `SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'exclusions'`,
    expect: (result) => result.length === 1,
  },
];

async function runTests() {
  console.log('🔍 Running migration verification tests...\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const [results] = await sequelize.query(test.query);
      const success = test.expect(results);

      if (success) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - Expected condition not met`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   Passed: ${passed}/${tests.length}`);
  console.log(`   Failed: ${failed}/${tests.length}`);

  if (failed === 0) {
    console.log('\n✅ All tests passed! Migration successful!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the results above.');
  }

  await sequelize.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
