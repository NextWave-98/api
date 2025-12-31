const ExcelJS = require('exceljs');

// Create workbook and worksheet
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Products');

// Add headers in the correct order for bulk upload
worksheet.columns = [
  { header: 'sku', key: 'sku', width: 15 },
  { header: 'barcode', key: 'barcode', width: 15 },
  { header: 'name', key: 'name', width: 30 },
  { header: 'description', key: 'description', width: 50 },
  { header: 'categoryName', key: 'categoryName', width: 20 },
  { header: 'brand', key: 'brand', width: 15 },
  { header: 'model', key: 'model', width: 15 },
  { header: 'unitPrice', key: 'unitPrice', width: 15 },
  { header: 'costPrice', key: 'costPrice', width: 15 },
  { header: 'wholesalePrice', key: 'wholesalePrice', width: 15 },
  { header: 'minStockLevel', key: 'minStockLevel', width: 12 },
  { header: 'maxStockLevel', key: 'maxStockLevel', width: 12 },
  { header: 'reorderLevel', key: 'reorderLevel', width: 12 },
  { header: 'reorderQuantity', key: 'reorderQuantity', width: 12 },
  { header: 'warrantyMonths', key: 'warrantyMonths', width: 12 },
  { header: 'isActive', key: 'isActive', width: 10 }
];

// Add data with Sri Lankan Rupee prices (physical products only)
const data = [
  { sku: 'IPH15-001', barcode: '1234567890123', name: 'iPhone 15', description: 'Latest Apple iPhone with advanced features', categoryName: 'Smartphones', brand: 'Apple', model: 'iPhone 15', unitPrice: 350000, costPrice: 280000, wholesalePrice: 320000, minStockLevel: 1, maxStockLevel: 10, reorderLevel: 2, reorderQuantity: 5, warrantyMonths: 12, isActive: true },
  { sku: 'IPH14-001', barcode: '1234567890124', name: 'iPhone 14', description: 'Previous generation Apple iPhone', categoryName: 'Smartphones', brand: 'Apple', model: 'iPhone 14', unitPrice: 280000, costPrice: 224000, wholesalePrice: 250000, minStockLevel: 1, maxStockLevel: 10, reorderLevel: 2, reorderQuantity: 5, warrantyMonths: 12, isActive: true },
  { sku: 'SGS23-001', barcode: '1234567890125', name: 'Samsung Galaxy S23', description: 'Flagship Samsung smartphone', categoryName: 'Smartphones', brand: 'Samsung', model: 'Galaxy S23', unitPrice: 220000, costPrice: 176000, wholesalePrice: 200000, minStockLevel: 1, maxStockLevel: 10, reorderLevel: 2, reorderQuantity: 5, warrantyMonths: 12, isActive: true },
  { sku: 'SGS22-001', barcode: '1234567890126', name: 'Samsung Galaxy S22', description: 'High-end Samsung smartphone', categoryName: 'Smartphones', brand: 'Samsung', model: 'Galaxy S22', unitPrice: 180000, costPrice: 144000, wholesalePrice: 160000, minStockLevel: 1, maxStockLevel: 10, reorderLevel: 2, reorderQuantity: 5, warrantyMonths: 12, isActive: true },
  { sku: 'PIX8-001', barcode: '1234567890127', name: 'Google Pixel 8', description: 'Google\'s latest Pixel phone', categoryName: 'Smartphones', brand: 'Google', model: 'Pixel 8', unitPrice: 250000, costPrice: 200000, wholesalePrice: 230000, minStockLevel: 1, maxStockLevel: 10, reorderLevel: 2, reorderQuantity: 5, warrantyMonths: 12, isActive: true },
  { sku: 'OP11-001', barcode: '1234567890128', name: 'OnePlus 11', description: 'Fast and powerful OnePlus smartphone', categoryName: 'Smartphones', brand: 'OnePlus', model: '11', unitPrice: 190000, costPrice: 152000, wholesalePrice: 170000, minStockLevel: 1, maxStockLevel: 10, reorderLevel: 2, reorderQuantity: 5, warrantyMonths: 12, isActive: true },
  { sku: 'X13P-001', barcode: '1234567890129', name: 'Xiaomi 13 Pro', description: 'Premium Xiaomi smartphone', categoryName: 'Smartphones', brand: 'Xiaomi', model: '13 Pro', unitPrice: 170000, costPrice: 136000, wholesalePrice: 150000, minStockLevel: 1, maxStockLevel: 10, reorderLevel: 2, reorderQuantity: 5, warrantyMonths: 12, isActive: true },
  { sku: 'CASE-IPH', barcode: '1234567890130', name: 'iPhone Case', description: 'Protective case for iPhone', categoryName: 'Accessories', brand: 'Generic', model: 'Standard Case', unitPrice: 5000, costPrice: 3000, wholesalePrice: 4000, minStockLevel: 5, maxStockLevel: 50, reorderLevel: 10, reorderQuantity: 20, warrantyMonths: 0, isActive: true },
  { sku: 'CASE-SAM', barcode: '1234567890131', name: 'Samsung Case', description: 'Protective case for Samsung phones', categoryName: 'Accessories', brand: 'Generic', model: 'Standard Case', unitPrice: 4500, costPrice: 2700, wholesalePrice: 3600, minStockLevel: 5, maxStockLevel: 50, reorderLevel: 10, reorderQuantity: 20, warrantyMonths: 0, isActive: true },
  { sku: 'GLASS-IPH', barcode: '1234567890132', name: 'Tempered Glass Screen Protector', description: 'Screen protection for smartphones', categoryName: 'Accessories', brand: 'Generic', model: 'Tempered Glass', unitPrice: 3000, costPrice: 1800, wholesalePrice: 2400, minStockLevel: 10, maxStockLevel: 100, reorderLevel: 20, reorderQuantity: 40, warrantyMonths: 0, isActive: true },
  { sku: 'CABLE-USB', barcode: '1234567890133', name: 'USB-C Charging Cable', description: 'Fast charging cable', categoryName: 'Accessories', brand: 'Generic', model: 'USB-C Cable', unitPrice: 2000, costPrice: 1200, wholesalePrice: 1600, minStockLevel: 20, maxStockLevel: 200, reorderLevel: 40, reorderQuantity: 80, warrantyMonths: 0, isActive: true },
  { sku: 'PBANK-10K', barcode: '1234567890134', name: 'Power Bank 10000mAh', description: 'Portable power bank', categoryName: 'Accessories', brand: 'Generic', model: '10000mAh', unitPrice: 8000, costPrice: 4800, wholesalePrice: 6400, minStockLevel: 5, maxStockLevel: 50, reorderLevel: 10, reorderQuantity: 20, warrantyMonths: 6, isActive: true },
  { sku: 'EARBUDS-WL', barcode: '1234567890135', name: 'Wireless Earbuds', description: 'Bluetooth wireless earbuds', categoryName: 'Accessories', brand: 'Generic', model: 'Wireless', unitPrice: 15000, costPrice: 9000, wholesalePrice: 12000, minStockLevel: 5, maxStockLevel: 30, reorderLevel: 8, reorderQuantity: 15, warrantyMonths: 6, isActive: true },
  { sku: 'SD-128GB', barcode: '1234567890136', name: 'MicroSD Card 128GB', description: 'Memory card for storage', categoryName: 'Accessories', brand: 'Generic', model: '128GB', unitPrice: 6000, costPrice: 3600, wholesalePrice: 4800, minStockLevel: 10, maxStockLevel: 100, reorderLevel: 20, reorderQuantity: 40, warrantyMonths: 12, isActive: true },
  { sku: 'STAND-PH', barcode: '1234567890137', name: 'Phone Stand', description: 'Adjustable phone stand', categoryName: 'Accessories', brand: 'Generic', model: 'Adjustable', unitPrice: 2500, costPrice: 1500, wholesalePrice: 2000, minStockLevel: 15, maxStockLevel: 150, reorderLevel: 30, reorderQuantity: 60, warrantyMonths: 0, isActive: true },
  { sku: 'BAT-IPH', barcode: '1234567890138', name: 'Replacement Battery iPhone', description: 'Battery for iPhone repair', categoryName: 'Parts & Components', brand: 'Generic', model: 'iPhone Battery', unitPrice: 12000, costPrice: 7200, wholesalePrice: 9600, minStockLevel: 2, maxStockLevel: 20, reorderLevel: 5, reorderQuantity: 10, warrantyMonths: 3, isActive: true },
  { sku: 'SCR-SAM', barcode: '1234567890139', name: 'LCD Screen Samsung', description: 'Replacement screen for Samsung', categoryName: 'Parts & Components', brand: 'Generic', model: 'Samsung Screen', unitPrice: 25000, costPrice: 15000, wholesalePrice: 20000, minStockLevel: 1, maxStockLevel: 10, reorderLevel: 3, reorderQuantity: 6, warrantyMonths: 6, isActive: true },
  { sku: 'PORT-IPH', barcode: '1234567890140', name: 'Charging Port iPhone', description: 'Replacement charging port', categoryName: 'Parts & Components', brand: 'Generic', model: 'iPhone Port', unitPrice: 8000, costPrice: 4800, wholesalePrice: 6400, minStockLevel: 3, maxStockLevel: 30, reorderLevel: 7, reorderQuantity: 14, warrantyMonths: 3, isActive: true },
  { sku: 'CAM-MOD', barcode: '1234567890141', name: 'Camera Module', description: 'Replacement camera for phones', categoryName: 'Parts & Components', brand: 'Generic', model: 'Camera Module', unitPrice: 15000, costPrice: 9000, wholesalePrice: 12000, minStockLevel: 2, maxStockLevel: 20, reorderLevel: 5, reorderQuantity: 10, warrantyMonths: 6, isActive: true },
  { sku: 'SPK-MOD', barcode: '1234567890142', name: 'Speaker Module', description: 'Replacement speaker', categoryName: 'Parts & Components', brand: 'Generic', model: 'Speaker Module', unitPrice: 5000, costPrice: 3000, wholesalePrice: 4000, minStockLevel: 5, maxStockLevel: 50, reorderLevel: 12, reorderQuantity: 24, warrantyMonths: 3, isActive: true },
  { sku: 'REF-IPH12', barcode: '1234567890149', name: 'Refurbished iPhone 12', description: 'Refurbished iPhone 12', categoryName: 'Refurbished Phones', brand: 'Apple', model: 'iPhone 12 Refurbished', unitPrice: 150000, costPrice: 120000, wholesalePrice: 135000, minStockLevel: 1, maxStockLevel: 5, reorderLevel: 2, reorderQuantity: 3, warrantyMonths: 6, isActive: true },
  { sku: 'REF-SAM-A52', barcode: '1234567890150', name: 'Refurbished Samsung A52', description: 'Budget refurbished Samsung', categoryName: 'Refurbished Phones', brand: 'Samsung', model: 'A52 Refurbished', unitPrice: 80000, costPrice: 64000, wholesalePrice: 72000, minStockLevel: 1, maxStockLevel: 5, reorderLevel: 2, reorderQuantity: 3, warrantyMonths: 6, isActive: true },
  { sku: 'REF-OP9', barcode: '1234567890151', name: 'Refurbished OnePlus 9', description: 'Mid-range refurbished OnePlus', categoryName: 'Refurbished Phones', brand: 'OnePlus', model: '9 Refurbished', unitPrice: 120000, costPrice: 96000, wholesalePrice: 108000, minStockLevel: 1, maxStockLevel: 5, reorderLevel: 2, reorderQuantity: 3, warrantyMonths: 6, isActive: true },
  { sku: 'REF-IPH13P', barcode: '1234567890152', name: 'Refurbished iPhone 13 Pro', description: 'Premium refurbished iPhone', categoryName: 'Refurbished Phones', brand: 'Apple', model: 'iPhone 13 Pro Refurbished', unitPrice: 250000, costPrice: 200000, wholesalePrice: 225000, minStockLevel: 1, maxStockLevel: 5, reorderLevel: 2, reorderQuantity: 3, warrantyMonths: 6, isActive: true }
];

// Add rows
data.forEach(row => {
  worksheet.addRow(row);
});

// Style the header row
worksheet.getRow(1).font = { bold: true };
worksheet.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE6E6FA' }
};

// Save the file
workbook.xlsx.writeFile('phone_shop_products.xlsx')
  .then(() => {
    console.log('Excel file created successfully!');
  })
  .catch(err => {
    console.error('Error creating Excel file:', err);
  });