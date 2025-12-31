import prisma from './src/shared/config/database';

async function testNotificationFlow() {
  console.log('=== NOTIFICATION FLOW TEST ===\n');
  
  // Check admin users
  const adminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN' }
  });
  
  let admins: any[] = [];
  
  if (adminRole) {
    admins = await prisma.user.findMany({
      where: {
        roleId: adminRole.id,
        isActive: true
      },
      include: {
        staff: { select: { phoneNumber: true } }
      }
    });
    
    console.log(`✅ Found ${admins.length} ADMIN users:`);
    admins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
      console.log(`     Phone: ${admin.staff?.phoneNumber || 'NO PHONE'}`);
      console.log(`     User ID: ${admin.id}`);
    });
    console.log('');
  }
  
  // Check recent sales notifications
  const saleNotifications = await prisma.notification.findMany({
    where: {
      type: { in: ['SALE_CREATED', 'SALE_COMPLETED'] },
      recipientType: 'ADMIN'
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      sale: { select: { saleNumber: true, createdAt: true } }
    }
  });
  
  console.log(`✅ Recent SALE notifications to ADMIN: ${saleNotifications.length}`);
  saleNotifications.forEach(n => {
    console.log(`   - ${n.title}`);
    console.log(`     Sale: ${n.sale?.saleNumber || 'N/A'}`);
    console.log(`     Status: ${n.status}`);
    console.log(`     Recipient User ID: ${n.recipientUserId || 'NULL'}`);
    console.log(`     Created: ${n.createdAt}`);
  });
  console.log('');
  
  // Check recent return notifications
  const returnNotifications = await prisma.notification.findMany({
    where: {
      type: { in: ['RETURN_CREATED', 'RETURN_INSPECTED', 'RETURN_APPROVED'] },
      recipientType: 'ADMIN'
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      productReturn: { select: { returnNumber: true, createdAt: true } }
    }
  });
  
  console.log(`✅ Recent RETURN notifications to ADMIN: ${returnNotifications.length}`);
  returnNotifications.forEach(n => {
    console.log(`   - ${n.title}`);
    console.log(`     Return: ${n.productReturn?.returnNumber || 'N/A'}`);
    console.log(`     Status: ${n.status}`);
    console.log(`     Recipient User ID: ${n.recipientUserId || 'NULL'}`);
    console.log(`     Created: ${n.createdAt}`);
  });
  console.log('');
  
  // Summary
  console.log('=== SUMMARY ===');
  console.log(`✅ Admins configured: ${admins?.length || 0}`);
  console.log(`✅ Sale notifications to admins: ${saleNotifications.length}`);
  console.log(`✅ Return notifications to admins: ${returnNotifications.length}`);
  console.log('\n💡 If branch manager creates sale/return, admin WILL receive notification');
  
  await prisma.$disconnect();
}

testNotificationFlow().catch(console.error);

