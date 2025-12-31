import prisma from './src/shared/config/database';

async function checkAdminNotifications() {
  try {
    const adminUserId = 'd8ba1bc3-7417-4c1f-9fc2-6dbf3d1d92cb';
    
    const notifications = await prisma.notification.findMany({
      where: {
        recipientType: 'ADMIN',
        recipientUserId: adminUserId
      },
      orderBy: { createdAt: 'desc' },
      select: {
        type: true,
        title: true,
        message: true,
        status: true,
        createdAt: true,
        saleId: true,
        productReturnId: true
      }
    });

    console.log('📊 Total Admin Notifications:', notifications.length);
    console.log('');
    
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.type} [${notif.status}]`);
      console.log(`   Title: ${notif.title}`);
      console.log(`   Sale: ${notif.saleId || 'N/A'}`);
      console.log(`   Return: ${notif.productReturnId || 'N/A'}`);
      console.log(`   Created: ${notif.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminNotifications();

