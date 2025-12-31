const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSaleWarranty() {
  try {
    console.log('='.repeat(60));
    console.log('CHECKING SALE AND WARRANTY STATUS');
    console.log('='.repeat(60));

    const saleId = '64c00621-42af-4f8f-85a3-a09ce4c20b8b';

    // Check if sale exists
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productCode: true,
                warrantyType: true
              }
            }
          }
        },
        customer: true,
        location: true
      }
    });

    if (!sale) {
      console.log('❌ Sale not found!');
      return;
    }

    console.log('\n✅ Sale Found:');
    console.log('  Sale Number:', sale.saleNumber);
    console.log('  Customer:', sale.customerName || 'Walk-in');
    console.log('  Location:', sale.location?.name || 'N/A');
    console.log('  Total Items:', sale.items.length);

    console.log('\n📦 Sale Items:');
    sale.items.forEach((item, index) => {
      console.log(`\n  Item ${index + 1}:`);
      console.log('    Product:', item.productName);
      console.log('    Product Code:', item.product?.productCode || 'N/A');
      console.log('    Quantity:', item.quantity);
      console.log('    Warranty Months:', item.warrantyMonths);
      console.log('    Warranty Expiry:', item.warrantyExpiry || 'N/A');
      console.log('    Has Warranty:', item.warrantyMonths > 0 ? '✅ YES' : '❌ NO');
    });

    // Check for warranty cards
    console.log('\n🛡️  Checking Warranty Cards...');
    const warranties = await prisma.warrantyCard.findMany({
      where: { saleId: saleId }
    });

    if (warranties.length === 0) {
      console.log('\n❌ NO WARRANTY CARDS FOUND!');
      console.log('\n🔍 Checking if items should have warranties:');
      
      const itemsWithWarranty = sale.items.filter(item => item.warrantyMonths > 0);
      if (itemsWithWarranty.length > 0) {
        console.log(`\n⚠️  ${itemsWithWarranty.length} item(s) have warranty but NO WARRANTY CARDS generated!`);
        console.log('\nItems that should have warranties:');
        itemsWithWarranty.forEach(item => {
          console.log(`  - ${item.productName} (${item.warrantyMonths} months)`);
        });
      } else {
        console.log('\n✅ No items have warranty, so no warranty cards expected.');
      }
    } else {
      console.log(`\n✅ Found ${warranties.length} warranty card(s):`);
      warranties.forEach((warranty, index) => {
        console.log(`\n  Warranty ${index + 1}:`);
        console.log('    Warranty Number:', warranty.warrantyNumber);
        console.log('    Product:', warranty.productName);
        console.log('    Customer:', warranty.customerName);
        console.log('    Status:', warranty.status);
        console.log('    Start Date:', warranty.startDate);
        console.log('    Expiry Date:', warranty.expiryDate);
        console.log('    Months:', warranty.warrantyMonths);
      });
    }

    // Check warranty cards by sale item
    console.log('\n🔗 Checking Warranty Cards by Sale Item ID:');
    for (const item of sale.items) {
      const warranty = await prisma.warrantyCard.findUnique({
        where: { saleItemId: item.id }
      });
      
      if (warranty) {
        console.log(`  ✅ Item "${item.productName}" has warranty: ${warranty.warrantyNumber}`);
      } else {
        if (item.warrantyMonths > 0) {
          console.log(`  ❌ Item "${item.productName}" should have warranty but NONE found!`);
        } else {
          console.log(`  ⚪ Item "${item.productName}" has no warranty (0 months)`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSIS COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSaleWarranty();
