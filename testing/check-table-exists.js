const { Client } = require('pg');
require('dotenv').config();

async function checkTable() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD)
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if notification_settings table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_settings'
      );
    `);

    console.log('\nTable notification_settings exists:', result.rows[0].exists);

    if (result.rows[0].exists) {
      // Get column information
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'notification_settings'
        ORDER BY ordinal_position;
      `);

      console.log('\nColumns in notification_settings:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });

      // Count existing records
      const count = await client.query('SELECT COUNT(*) FROM notification_settings');
      console.log(`\nExisting records: ${count.rows[0].count}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTable();
