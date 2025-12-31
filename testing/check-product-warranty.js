const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProductWarranty() {
  try {
    const products = await prisma.product.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        productCode: true,
        warrantyMonths: true,
        warrantyType: true
      }
    });
    
    console.log('Sample Products with Warranty Info:');
    console.log(JSON.stringify(products, null, 2));
    
    const withWarranty = products.filter(p => p.warrantyMonths > 0);
    console.log(`\n${withWarranty.length} out of ${products.length} products have warranty`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductWarranty();
