const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    // Check Sale records
    const salesCount = await prisma.sale.count();
    console.log('Total Sales (POS):', salesCount);
    
    const sales = await prisma.sale.findMany({
      take: 2,
      include: {
        branch: { select: { id: true, name: true } },
        soldBy: { select: { id: true, name: true } },
      },
    });
    console.log('\nSample Sales:', JSON.stringify(sales, null, 2));
    
    // Check SalePayment records
    const paymentsCount = await prisma.salePayment.count();
    console.log('\n\nTotal Sale Payments:', paymentsCount);
    
    const payments = await prisma.salePayment.findMany({
      take: 2,
      include: {
        sale: { select: { saleNumber: true } },
      },
    });
    console.log('Sample Payments:', JSON.stringify(payments, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
