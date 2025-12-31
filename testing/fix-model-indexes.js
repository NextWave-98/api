const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// List of files to fix based on grep results
const filesToFix = [
  'jobsheet.model.ts',
  'product-return.model.ts',
  'jobsheet-product.model.ts',
  'inventory-zone.model.ts',
  'inventory.model.ts',
  'branch-target.model.ts',
  'branch-staff.model.ts',
  'activity-log.model.ts',
  'payment.model.ts',
  'notification.model.ts',
  'notification-setting.model.ts',
  'sms-log.model.ts',
  'supplier-product.model.ts',
];

filesToFix.forEach((fileName) => {
  const filePath = path.join(modelsDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${fileName} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern to match: fields: ['fieldName', 'anotherField']
  const regex = /fields: \[([^\]]+)\]/g;
  
  content = content.replace(regex, (match, fieldsStr) => {
    // Split by comma and trim
    const fields = fieldsStr.split(',').map(f => f.trim().replace(/'/g, ''));
    
    // Check if any field has camelCase (contains uppercase letter)
    const hasUpperCase = fields.some(f => /[A-Z]/.test(f));
    
    if (hasUpperCase) {
      modified = true;
      // Convert all fields to snake_case
      const snakeCaseFields = fields.map(f => {
        const snakeCase = toSnakeCase(f);
        return `'${snakeCase}'`;
      });
      return `fields: [${snakeCaseFields.join(', ')}]`;
    }
    
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${fileName}`);
  } else {
    console.log(`⏭️  No changes needed for ${fileName}`);
  }
});

console.log('\n🎉 Done fixing model index fields!');
