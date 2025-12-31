const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      take: 5,
      select: { id: true, name: true, phone: true }
    });
    console.log('Sample customers:');
    customers.forEach(c => console.log(`ID: ${c.id}, Name: ${c.name}, Phone: ${c.phone}`));

    // Check recent sales
    const recentSales = await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { phone: true }
        }
      }
    });
    console.log('\nRecent sales:');
    recentSales.forEach(s => console.log(`ID: ${s.id}, Sale: ${s.saleNumber}, Status: ${s.status}, CustomerID: ${s.customerId}, CustomerPhone: ${s.customer?.phone}, Created: ${s.createdAt}`));

    // Check SMS logs
    const smsLogs = await prisma.sMSLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        recipient: true,
        message: true,
        status: true,
        response: true,
        createdAt: true
      }
    });
    console.log('\nRecent SMS logs:');
    smsLogs.forEach(log => console.log(`Type: ${log.type}, Recipient: ${log.recipient}, Status: ${log.status}, Response: ${log.response}, Created: ${log.createdAt}`));
    
    // Update the incorrect SENT status to FAILED for the notification that actually failed
    const failedNotification = await prisma.notification.findFirst({
      where: { 
        saleId: '1c5becb1-3678-4d75-b89a-214972da8a63',
        status: 'SENT'
      }
    });
    
    if (failedNotification) {
      // Check if there's a corresponding failed SMS log
      const failedSmsLog = await prisma.sMSLog.findFirst({
        where: {
          recipient: '94787514907',
          status: 'FAILED',
          createdAt: {
            gte: new Date(failedNotification.createdAt.getTime() - 1000), // 1 second before
            lte: new Date(failedNotification.createdAt.getTime() + 1000), // 1 second after
          }
        }
      });
      
      if (failedSmsLog) {
        console.log('Found failed SMS log for notification, updating status to FAILED');
        await prisma.notification.update({
          where: { id: failedNotification.id },
          data: { 
            status: 'FAILED',
            failureReason: 'SMS delivery failed with 403 authentication error'
          }
        });
      }
    }  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomers();