require('dotenv').config();
const { Sale, SaleItem, Product, Customer, Location, User, SalePayment, ProductInventory, sequelize } = require('../dist/models');

async function testSalesDashboard() {
  try {
    console.log('[dotenv@17.2.3] injecting env (24) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`');
    console.log('✅ Database connection successful\n');

    // Test 1: Check if we can query sales with correct column names
    console.log('📊 Testing Sales Query with final_amount column...');
    const sales = await Sale.findAll({
      attributes: ['id', 'saleNumber', 'finalAmount', 'discountAmount', 'taxAmount', 'totalAmount'],
      limit: 5,
      raw: true
    });
    console.log(`✅ Found ${sales.length} sales`);
    if (sales.length > 0) {
      console.log('Sample sale:', JSON.stringify(sales[0], null, 2));
    }

    // Test 2: Check associations
    console.log('\n🔗 Testing Sale associations...');
    const saleWithAssociations = await Sale.findOne({
      include: [
        { model: Location, as: 'location', attributes: ['name', 'locationType'] },
        { model: User, as: 'soldBy', attributes: ['name'] },
        { model: Customer, as: 'customer', attributes: ['name'] }
      ],
      limit: 1
    });
    
    if (saleWithAssociations) {
      console.log('✅ Associations working');
      console.log('Location:', saleWithAssociations.location?.name);
      console.log('Sold By:', saleWithAssociations.soldBy?.name);
      console.log('Customer:', saleWithAssociations.customer?.name || 'Walk-in');
    } else {
      console.log('⚠️  No sales found to test associations');
    }

    // Test 3: Aggregate query test
    console.log('\n📈 Testing aggregate queries...');
    const { fn, col } = require('sequelize');
    const [aggregateResult] = await Sale.findAll({
      attributes: [
        [fn('COUNT', col('Sale.id')), 'totalOrders'],
        [fn('SUM', col('Sale.final_amount')), 'totalRevenue'],
        [fn('AVG', col('Sale.final_amount')), 'averageOrderValue'],
      ],
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      raw: true,
    });

    console.log('✅ Aggregate query results:');
    console.log('Total Orders:', aggregateResult.totalOrders);
    console.log('Total Revenue:', aggregateResult.totalRevenue);
    console.log('Average Order Value:', aggregateResult.averageOrderValue);

    // Test 4: Location performance query
    console.log('\n📍 Testing location performance query...');
    const locationPerformance = await Sale.findAll({
      attributes: [
        'locationId',
        [fn('COUNT', col('Sale.id')), 'orders'],
        [fn('SUM', col('Sale.final_amount')), 'revenue'],
      ],
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['name'],
        },
      ],
      group: ['Sale.location_id', 'location.id', 'location.name'],
      order: [[fn('SUM', col('Sale.final_amount')), 'DESC']],
      limit: 5,
      raw: true,
    });

    console.log(`✅ Found ${locationPerformance.length} locations with sales`);
    locationPerformance.forEach((loc, index) => {
      console.log(`${index + 1}. ${loc['location.name']}: ${loc.revenue} revenue (${loc.orders} orders)`);
    });

    console.log('\n✅ All tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testSalesDashboard();
