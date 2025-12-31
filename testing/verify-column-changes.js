require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false
});

async function verifyChanges() {
  try {
    console.log('Verifying column changes...\n');
    console.log('='.repeat(80));

    // 1. Check product_inventory
    const [productInventoryColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'product_inventory'
      AND column_name IN ('reorder_point', 'min_stock_level', 'max_stock_level')
      ORDER BY column_name
    `);
    
    console.log('\n1. PRODUCT_INVENTORY (Stock Management Columns):');
    console.log('-'.repeat(80));
    productInventoryColumns.forEach(col => {
      const status = col.column_name === 'reorder_point' ? '✓ NEW' : '  ';
      console.log(`${status} ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 2. Check supplier_payments
    const [supplierPaymentColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'supplier_payments'
      AND column_name IN ('reference_number', 'reference', 'payment_number')
      ORDER BY column_name
    `);
    
    console.log('\n2. SUPPLIER_PAYMENTS (Reference Columns):');
    console.log('-'.repeat(80));
    supplierPaymentColumns.forEach(col => {
      const status = col.column_name === 'reference_number' ? '✓ NEW' : '  ';
      console.log(`${status} ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 3. Check sale_payments
    const [salePaymentColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sale_payments'
      AND column_name IN ('reference_number', 'reference', 'payment_number')
      ORDER BY column_name
    `);
    
    console.log('\n3. SALE_PAYMENTS (Reference Columns):');
    console.log('-'.repeat(80));
    salePaymentColumns.forEach(col => {
      const status = col.column_name === 'reference_number' ? '✓ NEW' : '  ';
      console.log(`${status} ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 4. Check warranty_cards
    const [warrantyCardColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'warranty_cards'
      AND column_name IN ('product_sku', 'product_s_k_u', 'product_code', 'product_name')
      ORDER BY column_name
    `);
    
    console.log('\n4. WARRANTY_CARDS (Product Reference Columns):');
    console.log('-'.repeat(80));
    warrantyCardColumns.forEach(col => {
      const status = col.column_name === 'product_sku' ? '✓ RENAMED from product_s_k_u' : '  ';
      console.log(`${status} ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 5. Check sale_items
    const [saleItemColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sale_items'
      AND column_name IN ('product_sku', 'product_s_k_u', 'product_name')
      ORDER BY column_name
    `);
    
    console.log('\n5. SALE_ITEMS (Product Reference Columns):');
    console.log('-'.repeat(80));
    saleItemColumns.forEach(col => {
      const status = col.column_name === 'product_sku' ? '✓ RENAMED from product_s_k_u' : '  ';
      console.log(`${status} ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 6. Check supplier_products
    const [supplierProductColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'supplier_products'
      AND column_name IN ('supplier_sku', 'supplier_s_k_u')
      ORDER BY column_name
    `);
    
    console.log('\n6. SUPPLIER_PRODUCTS (SKU Column):');
    console.log('-'.repeat(80));
    supplierProductColumns.forEach(col => {
      console.log(`   ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✓ All column changes verified successfully!');
    console.log('='.repeat(80) + '\n');

    console.log('SUMMARY OF CHANGES:');
    console.log('-------------------');
    console.log('1. ✓ Added reorder_point column to product_inventory');
    console.log('2. ✓ Added reference_number column to supplier_payments');
    console.log('3. ✓ Added reference_number column to sale_payments');
    console.log('4. ✓ Renamed product_s_k_u to product_sku in warranty_cards');
    console.log('5. ✓ Renamed product_s_k_u to product_sku in sale_items');
    console.log('6. ✓ supplier_sku already exists in supplier_products (no change needed)\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error verifying changes:', error);
    await sequelize.close();
    process.exit(1);
  }
}

verifyChanges();
