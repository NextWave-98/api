const { PrismaClient } = require('@prisma/client');
const { SMSService } = require('./src/modules/sms/sms.service');
const prisma = new PrismaClient();

async function testSMS() {
  try {
    console.log('Testing SMS service...');

    const smsService = new SMSService();
    console.log('SMS enabled:', smsService.config.enabled);

    // Test sending SMS
    const testResult = await smsService.sendSingleSMS({
      to: '+94787514907', // Test phone number
      msg: 'Test SMS from notification fix'
    });

    console.log('SMS test result:', testResult);

  } catch (error) {
    console.error('SMS test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSMS();