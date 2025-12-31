import { sequelize } from '../config/database';

async function checkWarrantyColumns() {
  try {
    console.log('\n=== Checking Database Columns ===\n');
    
    // Check warranty_cards table
    const [warrantyCards]: any = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'warranty_cards'
      ORDER BY ordinal_position;
    `);
    
    console.log('WARRANTY_CARDS TABLE:');
    console.log('Total columns:', warrantyCards.length);
    warrantyCards.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check warranty_claims table
    const [warrantyClaims]: any = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'warranty_claims'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nWARRANTY_CLAIMS TABLE:');
    console.log('Total columns:', warrantyClaims.length);
    warrantyClaims.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check if columns are snake_case or camelCase
    const warrantyCardCamelCase = warrantyCards.filter((c: any) => 
      c.column_name.includes('_') === false && 
      c.column_name !== 'id' && 
      c.column_name !== 'terms' && 
      c.column_name !== 'coverage' && 
      c.column_name !== 'exclusions' && 
      c.column_name !== 'notes' && 
      c.column_name !== 'attachments' &&
      c.column_name !== 'status'
    );
    
    const warrantyCardSnakeCase = warrantyCards.filter((c: any) => c.column_name.includes('_'));
    
    console.log('\n=== Column Name Analysis ===');
    console.log('warranty_cards - snake_case columns:', warrantyCardSnakeCase.length);
    console.log('warranty_cards - camelCase columns:', warrantyCardCamelCase.length);
    
    if (warrantyCardCamelCase.length > 0) {
      console.log('\nCamelCase columns found:');
      warrantyCardCamelCase.forEach((c: any) => console.log(`  - ${c.column_name}`));
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkWarrantyColumns();
