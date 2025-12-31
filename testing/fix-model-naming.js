/**
 * This script removes underscored: true and field mappings from all Sequelize models
 * to match the camelCase database schema created by Prisma
 */

const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');

function fixModelFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Remove underscored: true line
  const underscoredRegex = /,?\s*underscored:\s*true,?\s*\n/g;
  if (underscoredRegex.test(content)) {
    content = content.replace(underscoredRegex, '\n');
    modified = true;
  }

  // Remove field mappings for camelCase -> snake_case
  // Pattern: field: 'snake_case_name'
  const fieldRegex = /,?\s*field:\s*['"][\w_]+['"]/g;
  if (fieldRegex.test(content)) {
    content = content.replace(fieldRegex, '');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${path.basename(filePath)}`);
    return true;
  }

  return false;
}

// Get all model files
const files = fs.readdirSync(modelsDir)
  .filter(file => file.endsWith('.model.ts'))
  .map(file => path.join(modelsDir, file));

console.log(`Found ${files.length} model files\n`);

let fixedCount = 0;
files.forEach(file => {
  if (fixModelFile(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files`);
