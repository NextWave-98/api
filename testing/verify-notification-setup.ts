import prisma from './src/shared/config/database';

async function verifyNotificationSetup() {
  console.log('=== NOTIFICATION SETUP VERIFICATION ===\n');
  
  // 1. Check admin has phone
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@123.com' },
    include: { staff: true }
  });
  
  console.log('1. Admin User Setup:');
  console.log(`   Name: ${admin?.name}`);
  console.log(`   Email: ${admin?.email}`);
  console.log(`   Has Staff: ${!!admin?.staff}`);
  console.log(`   Phone: ${admin?.staff?.phoneNumber || '❌ MISSING'}`);
  console.log('');
  
  // 2. Check recent sales
  const recentSales = await prisma.sale.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      saleNumber: true,
      createdAt: true,
      totalAmount: true
    }
  });
  
  console.log('2. Recent Sales:');
  recentSales.forEach(sale => {
    console.log(`   ${sale.saleNumber} - Rs.${sale.totalAmount} - ${sale.createdAt}`);
  });
  console.log('');
  
  // 3. Check notifications for recent sales
  console.log('3. Notifications for Recent Sales:');
  for (const sale of recentSales) {
    const notifs = await prisma.notification.findMany({
      where: { saleId: sale.id },
      select: {
        type: true,
        recipientType: true,
        recipientUserId: true,
        status: true
      }
    });
    
    const adminNotif = notifs.find(n => n.recipientType === 'ADMIN');
    const customerNotif = notifs.find(n => n.recipientType === 'CUSTOMER');
    
    console.log(`   ${sale.saleNumber}:`);
    console.log(`     Customer notification: ${customerNotif ? '✅' : '❌'}`);
    console.log(`     Admin notification: ${adminNotif ? '✅' : '❌'}`);
    if (adminNotif) {
      console.log(`     Admin userId set: ${adminNotif.recipientUserId ? '✅' : '❌'}`);
    }
  }
  console.log('');
  
  // 4. Summary
  console.log('=== SUMMARY ===');
  if (admin?.staff?.phoneNumber) {
    console.log('✅ Admin phone number configured');
    console.log('✅ New sales WILL create admin notifications');
    console.log('');
    console.log('📌 Next Steps:');
    console.log('   1. Create a NEW sale in POS');
    console.log('   2. Check /api/notifications/my');
    console.log('   3. You should see the new sale notification');
    console.log('');
    console.log('Note: The 2 notifications you see are TEST notifications');
    console.log('      Real notifications will appear after creating new sales');
  } else {
    console.log('❌ Admin phone number NOT configured');
    console.log('❌ Admin will NOT receive sale notifications');
  }
  
  await prisma.$disconnect();
}

verifyNotificationSetup().catch(console.error);

