require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
});

async function testInventoryCreate() {
  try {
    console.log('Testing ProductInventory create...\n');
    
    const query = `
      INSERT INTO product_inventory (
        id, product_id, location_id, quantity, reserved_quantity, 
        available_quantity, storage_location, average_cost, total_value,
        last_restocked, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        'c6d3d55d-309c-462f-998f-a6934734e540',
        '0f4ed259-cfd3-4b19-bc96-228221b40bc1',
        51,
        0,
        51,
        'Main Storage',
        0,
        0,
        NOW(),
        NOW(),
        NOW()
      ) RETURNING *;
    `;
    
    console.log('Query:', query);
    const result = await sequelize.query(query, { type: sequelize.QueryTypes.INSERT });
    console.log('\n✅ Success!', result);
    
    // Delete the test record
    await sequelize.query(`DELETE FROM product_inventory WHERE id = '${result[0][0].id}'`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Code:', error.original?.code);
    console.error('Detail:', error.original?.detail);
  } finally {
    await sequelize.close();
  }
}

testInventoryCreate();
