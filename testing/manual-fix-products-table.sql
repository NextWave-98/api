-- ============================================
-- MANUAL FIX FOR PRODUCTS TABLE
-- ============================================
-- Run this SQL directly in your PostgreSQL database
-- This removes the incorrect relation columns from products table
-- ============================================

-- 1. First, verify what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 2. Remove incorrect relation columns (run these one by one)
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

-- 3. Verify the result (should be 35 columns)
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'products';

-- 4. List remaining columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
