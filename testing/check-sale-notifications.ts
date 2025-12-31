import prisma from './src/shared/config/database';

async function checkSaleNotifications() {
  console.log('=== CHECKING SALE NOTIFICATIONS ===\n');
  
  // Get recent sales
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      saleNumber: true,
      createdAt: true,
      status: true,
      customerName: true,
      totalAmount: true
    }
  });
  
  console.log(`Found ${sales.length} recent sales:`);
  sales.forEach(sale => {
    console.log(`  ${sale.saleNumber} - ${sale.customerName || 'No Customer'} - Rs.${sale.totalAmount} (${sale.status})`);
    console.log(`    Created: ${sale.createdAt}`);
  });
  console.log('');
  
  // Get all sale notifications
  const saleNotifs = await prisma.notification.findMany({
    where: {
      type: { in: ['SALE_CREATED', 'SALE_COMPLETED'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      type: true,
      title: true,
      saleId: true,
      recipientType: true,
      recipientUserId: true,
      status: true,
      createdAt: true
    }
  });
  
  console.log(`Found ${saleNotifs.length} sale notifications:`);
  saleNotifs.forEach(n => {
    console.log(`  ${n.type} - ${n.title}`);
    console.log(`    To: ${n.recipientType}, User ID: ${n.recipientUserId || 'NULL'}`);
    console.log(`    Status: ${n.status}, Created: ${n.createdAt}`);
  });
  console.log('');
  
  // Count admin notifications
  const adminNotifs = saleNotifs.filter(n => n.recipientType === 'ADMIN' && n.recipientUserId);
  console.log(`✅ Admin notifications (with userId): ${adminNotifs.length}`);
  
  const adminNotifsNoUserId = saleNotifs.filter(n => n.recipientType === 'ADMIN' && !n.recipientUserId);
  console.log(`⚠️  Admin notifications (without userId): ${adminNotifsNoUserId.length}`);
  
  await prisma.$disconnect();
}

checkSaleNotifications().catch(console.error);

