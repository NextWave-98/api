const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Create workbook and worksheet
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Categories');

// Add headers in the correct order for bulk upload
worksheet.columns = [
  { header: 'name', key: 'name', width: 30 },
  { header: 'description', key: 'description', width: 50 },
  { header: 'parentName', key: 'parentName', width: 30 },
  { header: 'isActive', key: 'isActive', width: 10 },
  { header: 'displayOrder', key: 'displayOrder', width: 12 }
];

// Read the CSV data
const csvContent = fs.readFileSync(path.join(__dirname, 'phone_shop_categories.csv'), 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Skip header and process data
const data = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Simple CSV parsing (handles basic commas)
  const cells = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
  if (cells.length >= 5) {
    data.push({
      name: cells[0]?.trim(),
      description: cells[1]?.trim() || '',
      parentName: cells[2]?.trim() || '',
      isActive: cells[3]?.toString().toLowerCase() === 'true',
      displayOrder: parseInt(cells[4]?.toString()) || 0,
    });
  }
}

// Add data to worksheet
data.forEach(row => {
  worksheet.addRow(row);
});

// Save the Excel file
const outputPath = path.join(__dirname, 'sample_categories.xlsx');
workbook.xlsx.writeFile(outputPath)
  .then(() => {
    console.log('Sample categories Excel file created successfully:', outputPath);
  })
  .catch(err => {
    console.error('Error creating Excel file:', err);
  });