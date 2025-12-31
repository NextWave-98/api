-- Drop extra columns from product_categories table
ALTER TABLE product_categories DROP COLUMN IF EXISTS products;
ALTER TABLE product_categories DROP COLUMN IF EXISTS parent;

-- Drop extra columns from products table
ALTER TABLE products DROP COLUMN IF EXISTS inventory;
ALTER TABLE products DROP COLUMN IF EXISTS supplier_products;
ALTER TABLE products DROP COLUMN IF EXISTS purchase_order_items;
ALTER TABLE products DROP COLUMN IF EXISTS stock_movements;
ALTER TABLE products DROP COLUMN IF EXISTS job_sheet_products;
ALTER TABLE products DROP COLUMN IF EXISTS stock_releases;
ALTER TABLE products DROP COLUMN IF EXISTS sale_items;
ALTER TABLE products DROP COLUMN IF EXISTS warranty_cards;
ALTER TABLE products DROP COLUMN IF EXISTS product_returns;
ALTER TABLE products DROP COLUMN IF EXISTS category;