-- Fix supplier table column types that are incorrectly set as UUID
-- These should be VARCHAR/TEXT as per Prisma schema

-- Change tax_id from UUID to VARCHAR
ALTER TABLE suppliers 
ALTER COLUMN tax_id TYPE VARCHAR(255) USING tax_id::VARCHAR;

-- Change registration_number from UUID to VARCHAR (if it's also UUID)
ALTER TABLE suppliers 
ALTER COLUMN registration_number TYPE VARCHAR(255) USING registration_number::VARCHAR;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'suppliers'
AND column_name IN ('tax_id', 'registration_number')
ORDER BY column_name;
