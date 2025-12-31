const fs = require('fs');
const path = require('path');

// Function to convert camelCase to snake_case
function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// Function to fix foreign keys in a file
function fixForeignKeysInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Match foreignKey: 'xxxId' or foreignKey: "xxxId" patterns
  const foreignKeyPattern = /foreignKey:\s*['"]([a-z][a-zA-Z]*Id)['"]/g;
  
  let matches = [];
  let match;
  while ((match = foreignKeyPattern.exec(content)) !== null) {
    matches.push({
      original: match[1],
      snake: toSnakeCase(match[1]),
      fullMatch: match[0]
    });
  }

  if (matches.length > 0) {
    console.log(`\n📄 ${path.basename(filePath)}`);
    matches.forEach(m => {
      if (m.original !== m.snake) {
        const newForeignKey = m.fullMatch.replace(m.original, m.snake);
        content = content.replace(m.fullMatch, newForeignKey);
        console.log(`  ${m.original} → ${m.snake}`);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Updated`);
      return true;
    }
  }

  return false;
}

// Main function
function main() {
  const modelsDir = path.join(__dirname, 'src', 'models');
  const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.model.ts'));

  console.log('🔍 Scanning model files for camelCase foreign keys...\n');

  let totalFixed = 0;

  files.forEach(file => {
    const filePath = path.join(modelsDir, file);
    if (fixForeignKeysInFile(filePath)) {
      totalFixed++;
    }
  });

  // Also fix index.ts
  const indexPath = path.join(modelsDir, 'index.ts');
  if (fs.existsSync(indexPath)) {
    console.log('\n📄 Checking index.ts...');
    if (fixForeignKeysInFile(indexPath)) {
      totalFixed++;
    }
  }

  console.log(`\n✅ Fixed ${totalFixed} files`);
}

main();
