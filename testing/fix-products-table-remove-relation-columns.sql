-- ============================================
-- FIX PRODUCTS TABLE - REMOVE INCORRECT RELATION COLUMNS
-- ============================================
-- These columns should NOT exist in the products table
-- They are Prisma relations defined in other tables via foreign keys
-- Created: 2025-12-17
-- ============================================

-- BACKUP FIRST (Optional but recommended)
-- CREATE TABLE products_backup AS SELECT * FROM products;

BEGIN;

-- Drop incorrect relation columns that were mistakenly added
-- These are relations, not actual database columns

ALTER TABLE products DROP COLUMN IF EXISTS inventory;
ALTER TABLE products DROP COLUMN IF EXISTS supplier_products;
ALTER TABLE products DROP COLUMN IF EXISTS purchase_order_items;
ALTER TABLE products DROP COLUMN IF EXISTS stock_movements;
ALTER TABLE products DROP COLUMN IF EXISTS job_sheet_products;
ALTER TABLE products DROP COLUMN IF EXISTS stock_releases;
ALTER TABLE products DROP COLUMN IF EXISTS sale_items;
ALTER TABLE products DROP COLUMN IF EXISTS warranty_cards;
ALTER TABLE products DROP COLUMN IF EXISTS product_returns;

-- Drop the duplicate 'category' column (we already have category_id)
ALTER TABLE products DROP COLUMN IF EXISTS category;

-- Verify the correct structure
-- The products table should only have these columns:
-- id, product_code, sku, barcode, name, description, category_id,
-- brand, model, compatibility, specifications, unit_price, cost_price,
-- wholesale_price, margin_percentage, tax_rate, min_stock_level,
-- max_stock_level, reorder_level, reorder_quantity, weight, dimensions,
-- warranty_months, warranty_type, quality_grade, terms, coverage,
-- exclusions, is_active, is_discontinued, discontinued_date, images,
-- primary_image, created_at, updated_at

-- Verify column count (should be 35 columns)
SELECT COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'products';

-- Display remaining columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after executing the migration:

-- 1. Check total column count (should be 35)
-- SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'products';

-- 2. Verify all indexes are intact
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'products';

-- 3. Verify foreign key constraint to product_categories
-- SELECT conname, contype FROM pg_constraint WHERE conrelid = 'products'::regclass;

-- ============================================
-- NOTES
-- ============================================
-- Relations in Sequelize/Prisma are defined through:
-- 1. Foreign keys in the RELATED tables (e.g., product_inventory has product_id)
-- 2. NOT as columns in the products table itself
-- 
-- Correct structure:
-- - product_inventory table has: product_id (FK to products.id)
-- - supplier_products table has: product_id (FK to products.id)
-- - purchase_order_items table has: product_id (FK to products.id)
-- - etc.
-- ============================================
