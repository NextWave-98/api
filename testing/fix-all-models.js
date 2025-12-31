const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.model.ts') && f !== 'index.ts');

console.log(`Processing ${files.length} model files...\n`);

let totalFixed = 0;

files.forEach(file => {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // 1. Remove underscored: true
  content = content.replace(/,?\s*underscored:\s*true,?\s*/g, '');
  
  // 2. Remove field: 'snake_case' mappings from Column decorators
  content = content.replace(/@Column\(\{\s*([^}]*?),?\s*field:\s*['"]([^'"]+)['"]([^}]*?)\}\)/g, 
    (match, before, fieldName, after) => {
      // Clean up extra commas
      let cleaned = before + after;
      cleaned = cleaned.replace(/,\s*,/g, ',').replace(/,\s*}/g, '}').replace(/{\s*,/g, '{');
      return `@Column({${cleaned}})`;
    });
  
  // 3. Fix index field names from snake_case to camelCase
  content = content.replace(/fields:\s*\[([^\]]+)\]/g, (match, fieldsStr) => {
    const fixed = fieldsStr.replace(/'([^']+)'/g, (m, field) => {
      // Convert snake_case to camelCase
      const camelCase = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      return `'${camelCase}'`;
    });
    return `fields: [${fixed}]`;
  });
  
  // 4. Fix HasMany/BelongsTo foreign key references
  content = content.replace(/foreignKey:\s*['"]([^'"]+)['"]/g, (match, fk) => {
    // Convert snake_case to camelCase
    const camelCase = fk.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    return `foreignKey: '${camelCase}'`;
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${file}`);
    totalFixed++;
  } else {
    console.log(`  Skipped: ${file} (no changes needed)`);
  }
});

console.log(`\n✓ Fixed ${totalFixed} out of ${files.length} files`);
