const { Client } = require('pg');
require('dotenv').config();

async function verifySettings() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const result = await client.query(`
      SELECT 
        notification_type,
        enabled,
        admin_enabled,
        manager_enabled,
        customer_enabled,
        staff_enabled,
        sms_enabled,
        email_enabled,
        whatsapp_enabled,
        priority,
        auto_send
      FROM notification_settings
      ORDER BY notification_type
    `);

    console.log(`📊 Total notification settings: ${result.rows.length}\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.notification_type}`);
      console.log(`   Enabled: ${row.enabled} | Priority: ${row.priority} | Auto-send: ${row.auto_send}`);
      console.log(`   Recipients: Admin=${row.admin_enabled}, Manager=${row.manager_enabled}, Customer=${row.customer_enabled}, Staff=${row.staff_enabled}`);
      console.log(`   Channels: SMS=${row.sms_enabled}, Email=${row.email_enabled}, WhatsApp=${row.whatsapp_enabled}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifySettings();
