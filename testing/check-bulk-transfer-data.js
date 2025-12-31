require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false
});

async function checkData() {
  try {
    console.log('Checking data for bulk transfer test...\n');
    console.log('='.repeat(80));

    // Check locations
    console.log('\n1. CHECKING LOCATIONS:');
    console.log('-'.repeat(80));
    const [locations] = await sequelize.query(`
      SELECT id, location_code, name, location_type, is_active
      FROM locations 
      WHERE id IN (
        '50a387a7-a7d4-400c-88a1-c3049346e7c0',
        '0f4ed259-cfd3-4b19-bc96-228221b40bc1'
      )
    `);
    
    if (locations.length === 0) {
      console.log('❌ No locations found with these IDs');
      console.log('\nAvailable locations:');
      const [allLocations] = await sequelize.query(`
        SELECT id, location_code, name, location_type, is_active
        FROM locations 
        WHERE is_active = true
        ORDER BY location_code
        LIMIT 10
      `);
      allLocations.forEach(loc => {
        console.log(`  ${loc.location_code.padEnd(15)} ${loc.name.padEnd(30)} ${loc.location_type.padEnd(15)} ${loc.id}`);
      });
    } else {
      locations.forEach(loc => {
        console.log(`✓ ${loc.location_code.padEnd(15)} ${loc.name.padEnd(30)} ${loc.location_type.padEnd(15)} Active: ${loc.is_active}`);
      });
    }

    // Check product
    console.log('\n2. CHECKING PRODUCT:');
    console.log('-'.repeat(80));
    const [products] = await sequelize.query(`
      SELECT id, product_code, name, is_active
      FROM products 
      WHERE id = 'c6d3d55d-309c-462f-998f-a6934734e540'
    `);
    
    if (products.length === 0) {
      console.log('❌ No product found with this ID');
      console.log('\nAvailable products:');
      const [allProducts] = await sequelize.query(`
        SELECT id, product_code, name, is_active
        FROM products 
        WHERE is_active = true
        ORDER BY product_code
        LIMIT 10
      `);
      allProducts.forEach(prod => {
        console.log(`  ${prod.product_code.padEnd(15)} ${prod.name.padEnd(40)} ${prod.id}`);
      });
    } else {
      products.forEach(prod => {
        console.log(`✓ ${prod.product_code.padEnd(15)} ${prod.name.padEnd(40)} Active: ${prod.is_active}`);
      });
    }

    // Check inventory
    if (products.length > 0 && locations.length > 0) {
      console.log('\n3. CHECKING INVENTORY:');
      console.log('-'.repeat(80));
      const [inventory] = await sequelize.query(`
        SELECT pi.*, l.location_code, l.name as location_name, p.name as product_name
        FROM product_inventory pi
        JOIN locations l ON pi.location_id = l.id
        JOIN products p ON pi.product_id = p.id
        WHERE pi.product_id = 'c6d3d55d-309c-462f-998f-a6934734e540'
        AND pi.location_id = '50a387a7-a7d4-400c-88a1-c3049346e7c0'
      `);
      
      if (inventory.length === 0) {
        console.log('❌ No inventory found for this product at fromLocation');
        console.log('\nInventory for this product:');
        const [prodInventory] = await sequelize.query(`
          SELECT pi.*, l.location_code, l.name as location_name
          FROM product_inventory pi
          JOIN locations l ON pi.location_id = l.id
          WHERE pi.product_id = 'c6d3d55d-309c-462f-998f-a6934734e540'
        `);
        prodInventory.forEach(inv => {
          console.log(`  ${inv.location_code.padEnd(15)} ${inv.location_name.padEnd(30)} Qty: ${inv.quantity} Available: ${inv.available_quantity}`);
        });
      } else {
        inventory.forEach(inv => {
          console.log(`✓ Product: ${inv.product_name}`);
          console.log(`  Location: ${inv.location_code} - ${inv.location_name}`);
          console.log(`  Total Quantity: ${inv.quantity}`);
          console.log(`  Reserved: ${inv.reserved_quantity}`);
          console.log(`  Available: ${inv.available_quantity}`);
          console.log(`  Requested Transfer: 51 units`);
          console.log(`  Transfer Possible: ${inv.available_quantity >= 51 ? '✓ YES' : '❌ NO - Insufficient stock'}`);
        });
      }
    }

    console.log('\n' + '='.repeat(80));
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

checkData();
