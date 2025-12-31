/**
 * Direct test of ProductInventory query to see actual error
 */

const { sequelize } = require('../src/config/database');
const { ProductInventory } = require('../src/models/product-inventory.model');
const { Product } = require('../src/models/product.model');
const { ProductCategory } = require('../src/models/product-category.model');
const { Location } = require('../src/models/location.model');
const { Op } = require('sequelize');

require('dotenv').config();

async function testQuery() {
  try {
    console.log('🧪 Testing ProductInventory.findAll() query...\n');

    const result = await ProductInventory.findAll({
      limit: 10,
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: ProductCategory,
              as: 'category',
              attributes: ['id', 'name', 'categoryCode']
            }
          ],
          attributes: ['id', 'productCode', 'sku', 'barcode', 'name', 'brand', 'model', 'unitPrice', 'costPrice']
        },
        {
          model: Location,
          as: 'location',
          where: { locationType: 'BRANCH' },
          required: true,
          attributes: ['id', 'name', 'locationCode', 'address']
        }
      ]
    });

    console.log('✅ Query successful!');
    console.log(`Found ${result.length} records\n`);

    if (result.length > 0) {
      const first = result[0].toJSON();
      console.log('First record:');
      console.log(JSON.stringify(first, null, 2));
    }

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Query failed!\n');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    
    if (error.original) {
      console.error('\nOriginal DB Error:', error.original.message);
    }

    await sequelize.close();
    process.exit(1);
  }
}

testQuery();
