/**
 * Deep Schema Analysis: Prisma SQL vs Sequelize Models
 * This script analyzes all discrepancies between the Prisma migration SQL and Sequelize models
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('DEEP SCHEMA ANALYSIS: Prisma vs Sequelize');
console.log('='.repeat(80));

// Read the Prisma migration SQL
const prismaSqlPath = path.join(__dirname, '../prisma/migrations/20251213054200_fullmigrations/migration.sql');
const prismaSql = fs.readFileSync(prismaSqlPath, 'utf8');

// Parse Prisma SQL to extract table definitions
const tableRegex = /CREATE TABLE "(\w+)" \(([\s\S]*?)\);/g;
const columnRegex = /"(\w+)"\s+([^,\n]+)/g;
const prismaSchema = {};

let match;
while ((match = tableRegex.exec(prismaSql)) !== null) {
  const tableName = match[1];
  const tableContent = match[2];
  const columns = {};
  
  let columnMatch;
  const columnRegexLocal = /"(\w+)"\s+([^,\n]+)/g;
  while ((columnMatch = columnRegexLocal.exec(tableContent)) !== null) {
    const colName = columnMatch[1];
    const colDef = columnMatch[2].trim();
    
    // Skip constraint definitions
    if (!colDef.startsWith('CONSTRAINT') && !colDef.startsWith('UNIQUE') && 
        !colDef.startsWith('PRIMARY KEY') && !colDef.startsWith('FOREIGN KEY')) {
      columns[colName] = colDef;
    }
  }
  
  prismaSchema[tableName] = columns;
}

console.log('\n📊 PRISMA SCHEMA TABLES:', Object.keys(prismaSchema).length);
console.log('Tables:', Object.keys(prismaSchema).join(', '));

// Expected Sequelize models based on the Prisma schema
const expectedModels = [
  'users', 'staff', 'locations', 'warehouses', 'branches',
  'warehouse_staff', 'branch_staff', 'inventory_zones', 'warehouse_inventory',
  'stock_transfers', 'stock_transfer_items', 'branch_targets',
  'roles', 'permissions', 'customers', 'devices', 'job_sheets',
  'repairs', 'parts', 'inventory', 'job_sheet_parts', 'stock_movements',
  'payments', 'job_status_history', 'notifications', 'notification_settings',
  'activity_logs', 'product_categories', 'products', 'suppliers',
  'supplier_products', 'purchase_orders', 'purchase_order_items',
  'po_status_history', 'goods_receipts', 'goods_receipt_items',
  'supplier_returns', 'supplier_return_items', 'supplier_payments',
  'product_inventory', 'product_stock_movements', 'stock_releases',
  'stock_release_items', 'job_sheet_products', 'sales', 'sale_items',
  'sale_payments', 'sale_refunds', 'warranty_cards', 'warranty_claims',
  'sms_logs', 'product_returns'
];

console.log('\n📋 EXPECTED SEQUELIZE MODELS:', expectedModels.length);

// Critical Issues to Check
const issues = {
  missingTables: [],
  missingColumns: [],
  incorrectTypes: [],
  missingIndexes: [],
  missingRelations: [],
  enumIssues: []
};

// Check for critical missing tables
const prismaTableNames = Object.keys(prismaSchema);
expectedModels.forEach(model => {
  if (!prismaTableNames.includes(model)) {
    issues.missingTables.push(model);
  }
});

// Detailed column analysis for key tables
const keyTablesAnalysis = {
  users: {
    required: ['id', 'email', 'name', 'password', 'role_id', 'location_id', 'is_active', 'refresh_token', 'last_login'],
    optional: []
  },
  staff: {
    required: ['id', 'staff_id', 'user_id', 'nic_number', 'date_of_birth', 'phone_number', 
               'additional_phone', 'emergency_contact', 'emergency_name', 'emergency_relation',
               'joining_date', 'profile_image', 'cloudinary_public_id'],
    optional: ['address', 'qualifications', 'experience', 'documents', 'notes']
  },
  locations: {
    required: ['id', 'location_code', 'name', 'location_type', 'is_active', 'warehouse_id', 'branch_id'],
    optional: ['address', 'city', 'phone', 'phone2', 'phone3', 'email']
  },
  warehouses: {
    required: ['id', 'warehouse_code', 'name', 'address', 'city', 'phone', 'country',
               'warehouse_type', 'is_main_warehouse', 'is_active'],
    optional: ['district', 'province', 'postal_code', 'alternate_phone', 'email',
               'manager_name', 'manager_phone', 'manager_email', 'total_area',
               'storage_capacity', 'zones', 'has_cold_storage', 'has_security_system',
               'has_loading_dock', 'has_forklift', 'parking_spaces', 'operating_hours',
               'opening_date', 'closure_date', 'closure_reason', 'notes', 'images', 'documents']
  },
  branches: {
    required: ['id', 'branch_code', 'name', 'address', 'city', 'phone', 'country',
               'branch_type', 'has_service_center', 'is_active'],
    optional: ['short_name', 'description', 'district', 'province', 'postal_code',
               'alternate_phone', 'fax', 'email', 'website', 'manager_name', 'manager_phone',
               'manager_email', 'business_reg_no', 'tax_id', 'services', 'has_showroom',
               'has_parking', 'floor_area', 'daily_capacity', 'technician_count',
               'service_counters', 'operating_hours', 'monthly_target', 'yearly_target',
               'opening_date', 'closure_date', 'closure_reason', 'notes', 'images', 'documents']
  },
  products: {
    required: ['id', 'product_code', 'name', 'category_id', 'unit_price', 'cost_price', 'tax_rate'],
    optional: ['sku', 'barcode', 'brand', 'model', 'description', 'wholesale_price',
               'margin_percentage', 'weight', 'dimensions', 'min_stock_level',
               'max_stock_level', 'reorder_level', 'reorder_quantity', 'warranty_months',
               'warranty_period', 'warranty_type', 'warranty_terms', 'terms', 'coverage',
               'exclusions', 'image_url', 'cloudinary_id', 'images', 'primary_image',
               'quality_grade', 'is_discontinued', 'discontinued_date', 'tags']
  },
  job_sheets: {
    required: ['id', 'job_number', 'customer_id', 'device_id', 'location_id',
               'created_by_id', 'issue_description', 'status', 'priority',
               'received_date', 'estimated_cost', 'actual_cost', 'labour_cost',
               'parts_cost', 'discount_amount', 'total_amount', 'paid_amount', 'balance_amount'],
    optional: ['assigned_to_id', 'customer_remarks', 'technician_remarks',
               'device_condition', 'accessories', 'device_password', 'backup_taken',
               'expected_date', 'completed_date', 'delivered_date', 'warranty_period',
               'warranty_expiry']
  },
  sales: {
    required: ['id', 'sale_number', 'location_id', 'sold_by_id', 'sale_type',
               'sale_channel', 'subtotal', 'discount', 'tax', 'tax_rate',
               'total_amount', 'paid_amount', 'balance_amount', 'payment_status', 'status'],
    optional: ['customer_id', 'customer_name', 'customer_phone', 'customer_email',
               'discount_type', 'discount_reason', 'payment_method', 'payment_reference',
               'notes', 'invoice_url']
  },
  warranty_cards: {
    required: ['id', 'warranty_number', 'sale_id', 'sale_item_id', 'product_id',
               'product_name', 'product_code', 'customer_name', 'customer_phone',
               'location_id', 'warranty_type', 'warranty_months', 'start_date',
               'expiry_date', 'status', 'activated_at'],
    optional: ['product_sku', 'serial_number', 'customer_id', 'customer_email',
               'terms', 'coverage', 'exclusions', 'voided_at', 'void_reason']
  },
  notifications: {
    required: ['id', 'type', 'title', 'message', 'method', 'recipient', 'status',
               'recipient_type', 'priority'],
    optional: ['customer_id', 'job_sheet_id', 'sale_id', 'product_return_id',
               'event_type', 'recipient_user_id', 'recipient_role', 'workflow_stage',
               'parent_notification_id', 'retry_count', 'last_retry_at',
               'failure_reason', 'metadata', 'sent_at']
  },
  purchase_orders: {
    required: ['id', 'po_number', 'supplier_id', 'order_date', 'status',
               'priority', 'payment_status', 'subtotal', 'tax_amount',
               'shipping_cost', 'discount_amount', 'total_amount', 'paid_amount', 'balance_amount'],
    optional: ['expected_date', 'received_date', 'approved_at', 'payment_terms',
               'shipping_method', 'shipping_address', 'notes', 'internal_notes',
               'attachments', 'approved_by']
  },
  supplier_returns: {
    required: ['id', 'return_number', 'supplier_id', 'return_date', 'return_type',
               'reason', 'status', 'total_amount', 'refund_amount'],
    optional: ['purchase_order_id', 'reason_description', 'refund_method',
               'refund_date', 'replacement_issued', 'approved_by', 'approved_at',
               'notes', 'attachments']
  },
  product_returns: {
    required: ['id', 'return_number', 'return_date', 'location_id', 'source_type',
               'category', 'status'],
    optional: ['sale_id', 'warranty_claim_id', 'job_sheet_id', 'goods_receipt_id',
               'customer_id', 'product_id', 'quantity', 'reason', 'reason_description',
               'condition', 'resolution_type', 'inspected_by', 'inspected_at',
               'inspection_notes', 'approved_by', 'approved_at', 'completed_at',
               'created_by_id', 'notes', 'images']
  }
};

console.log('\n🔍 ANALYZING KEY TABLES...\n');

for (const [tableName, expectedColumns] of Object.entries(keyTablesAnalysis)) {
  const prismaColumns = prismaSchema[tableName];
  
  if (!prismaColumns) {
    console.log(`❌ TABLE MISSING: ${tableName}`);
    issues.missingTables.push(tableName);
    continue;
  }
  
  const prismaColumnNames = Object.keys(prismaColumns);
  const allExpected = [...expectedColumns.required, ...expectedColumns.optional];
  
  const missingInPrisma = allExpected.filter(col => !prismaColumnNames.includes(col));
  const extraInPrisma = prismaColumnNames.filter(col => 
    !allExpected.includes(col) && 
    !['created_at', 'updated_at'].includes(col)
  );
  
  if (missingInPrisma.length > 0 || extraInPrisma.length > 0) {
    console.log(`\n📋 ${tableName.toUpperCase()}`);
    
    if (missingInPrisma.length > 0) {
      console.log(`  ❌ Missing columns:`, missingInPrisma.join(', '));
      issues.missingColumns.push({ table: tableName, columns: missingInPrisma });
    }
    
    if (extraInPrisma.length > 0) {
      console.log(`  ⚠️  Extra columns:`, extraInPrisma.join(', '));
    }
    
    console.log(`  ✅ Total columns in Prisma: ${prismaColumnNames.length}`);
  } else {
    console.log(`✅ ${tableName}: All columns present (${prismaColumnNames.length} columns)`);
  }
}

// Check for role_permissions junction table
console.log('\n\n🔗 CHECKING JUNCTION TABLES...\n');

const junctionTables = ['role_permissions'];
junctionTables.forEach(table => {
  if (prismaSchema[table]) {
    console.log(`✅ ${table}: EXISTS`);
  } else {
    console.log(`❌ ${table}: MISSING`);
    issues.missingTables.push(table);
  }
});

// Summary
console.log('\n' + '='.repeat(80));
console.log('SUMMARY OF ISSUES');
console.log('='.repeat(80));

if (issues.missingTables.length > 0) {
  console.log(`\n❌ MISSING TABLES (${issues.missingTables.length}):`);
  issues.missingTables.forEach(table => console.log(`   - ${table}`));
}

if (issues.missingColumns.length > 0) {
  console.log(`\n❌ TABLES WITH MISSING COLUMNS (${issues.missingColumns.length}):`);
  issues.missingColumns.forEach(item => {
    console.log(`   - ${item.table}: ${item.columns.join(', ')}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('ANALYSIS COMPLETE');
console.log('='.repeat(80));

// Write detailed report
const report = {
  timestamp: new Date().toISOString(),
  prismaTablesCount: prismaTableNames.length,
  expectedModelsCount: expectedModels.length,
  issues: issues
};

fs.writeFileSync(
  path.join(__dirname, 'schema-analysis-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n📄 Detailed report saved to: schema-analysis-report.json\n');
