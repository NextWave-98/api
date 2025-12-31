import prisma from './src/shared/config/database';

async function testReturnNotifications() {
  try {
    console.log('🔍 Testing Return Notification Flow...\n');
    
    // 1. Get the most recent return
    const latestReturn = await prisma.productReturn.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true } },
        location: { select: { name: true } },
        customer: { select: { name: true, phone: true } },
      }
    });

    if (!latestReturn) {
      console.log('❌ No returns found in database');
      return;
    }

    console.log('📦 Latest Return:');
    console.log(`   Return Number: ${latestReturn.returnNumber}`);
    console.log(`   Product: ${latestReturn.product.name}`);
    console.log(`   Status: ${latestReturn.status}`);
    console.log(`   Customer: ${latestReturn.customer?.name || latestReturn.customerName}`);
    console.log(`   Refund: Rs.${latestReturn.refundAmount}`);
    console.log('');

    // 2. Check notifications for this return
    const notifications = await prisma.notification.findMany({
      where: { productReturnId: latestReturn.id },
      orderBy: { createdAt: 'asc' },
      select: {
        type: true,
        recipientType: true,
        status: true,
        recipientUserId: true,
        createdAt: true,
      }
    });

    console.log(`📬 Notifications (${notifications.length} total):`);
    
    const groupedByType: Record<string, any[]> = {};
    notifications.forEach(n => {
      if (!groupedByType[n.type]) groupedByType[n.type] = [];
      groupedByType[n.type].push(n);
    });

    Object.entries(groupedByType).forEach(([type, notifs]) => {
      console.log(`\n   ${type}:`);
      notifs.forEach(n => {
        const recipient = n.recipientType === 'CUSTOMER' ? 'Customer' : 
                         n.recipientUserId ? `Admin (${n.recipientUserId.substring(0, 8)})` : 
                         'Admin';
        console.log(`     ✅ ${recipient} - [${n.status}] - ${n.createdAt.toLocaleTimeString()}`);
      });
    });

    // 3. Expected flow
    console.log('\n\n📋 Expected Notification Flow:');
    console.log('   1. RETURN_CREATED (when manager creates return)');
    console.log('      → Customer notification');
    console.log('      → Admin notifications');
    console.log('');
    console.log('   2. RETURN_APPROVED (when admin approves)');
    console.log('      → Customer notification');
    console.log('      → Admin notifications');
    console.log('');
    console.log('   3. RETURN_COMPLETED (when cash refund processed)');
    console.log('      → Customer notification');
    console.log('      → Admin notifications');
    console.log('');

    // 4. Check what's missing
    const hasCreated = notifications.some(n => n.type === 'RETURN_CREATED');
    const hasApproved = notifications.some(n => n.type === 'RETURN_APPROVED');
    const hasCompleted = notifications.some(n => n.type === 'RETURN_COMPLETED');

    console.log('✅ Status Check:');
    console.log(`   RETURN_CREATED:   ${hasCreated ? '✅' : '❌'}`);
    console.log(`   RETURN_APPROVED:  ${hasApproved ? '✅' : '❌'}`);
    console.log(`   RETURN_COMPLETED: ${hasCompleted ? '✅' : '❌'}`);
    console.log('');

    if (latestReturn.status === 'PENDING') {
      console.log('💡 TIP: This return is still PENDING. To test:');
      console.log('   1. Approve the return (sends RETURN_APPROVED notifications)');
      console.log('   2. Process cash refund (sends RETURN_COMPLETED notifications)');
    } else if (latestReturn.status === 'APPROVED') {
      console.log('💡 TIP: This return is APPROVED but not completed.');
      console.log('   Process the cash refund to send RETURN_COMPLETED notifications.');
    } else if (latestReturn.status === 'COMPLETED') {
      console.log('✅ This return is completed. All notifications should be sent.');
      if (!hasCompleted) {
        console.log('   ⚠️ WARNING: RETURN_COMPLETED notifications are missing!');
        console.log('   This return was completed BEFORE the fix was applied.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReturnNotifications();

