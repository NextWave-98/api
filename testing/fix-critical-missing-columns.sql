-- CRITICAL MISSING COLUMNS FIX
-- These are actual database columns that are missing and causing errors

-- ============================================
-- PAYMENTS TABLE - Missing payment_number
-- ============================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_number VARCHAR(50) UNIQUE NOT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS received_by_id UUID REFERENCES users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference VARCHAR(255);

-- ============================================
-- SALE_PAYMENTS TABLE - Missing payment_number
-- ============================================
ALTER TABLE sale_payments ADD COLUMN IF NOT EXISTS payment_number VARCHAR(50) UNIQUE NOT NULL;
ALTER TABLE sale_payments ADD COLUMN IF NOT EXISTS reference VARCHAR(255);
ALTER TABLE sale_payments ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE sale_payments ADD COLUMN IF NOT EXISTS received_by_id UUID REFERENCES users(id);

-- ============================================
-- SUPPLIER_PAYMENTS TABLE - Missing columns
-- ============================================
ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS reference VARCHAR(255);
ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS check_number VARCHAR(255);
ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);
ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS attachments JSONB;
ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES users(id);

-- ============================================
-- SALES TABLE - Missing critical columns
-- ============================================
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_channel VARCHAR(50) DEFAULT 'POS';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_reason VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tax DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_url VARCHAR(500);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- SALE_ITEMS TABLE - Missing columns
-- ============================================
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) NOT NULL;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS product_sku VARCHAR(100);
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12,2) NOT NULL;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS discount DECIMAL(12,2) NOT NULL DEFAULT 0;

-- ============================================
-- SALE_REFUNDS TABLE - Missing columns
-- ============================================
ALTER TABLE sale_refunds ADD COLUMN IF NOT EXISTS processed_by_id UUID REFERENCES users(id);

-- ============================================
-- REPAIRS TABLE - Missing columns
-- ============================================
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS repair_type VARCHAR(255) NOT NULL;
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- ============================================
-- JOB_STATUS_HISTORY TABLE - Missing columns
-- ============================================
ALTER TABLE job_status_history ADD COLUMN IF NOT EXISTS changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE job_status_history ADD COLUMN IF NOT EXISTS remarks TEXT;

-- ============================================
-- NOTIFICATIONS TABLE - Missing columns
-- ============================================
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS job_sheet_id UUID REFERENCES job_sheets(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS method VARCHAR(50) NOT NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient VARCHAR(255) NOT NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'PENDING';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- ACTIVITY_LOGS TABLE - Missing columns
-- ============================================
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS module VARCHAR(100) NOT NULL;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS record_id UUID;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS details JSONB;

-- ============================================
-- STOCK_TRANSFERS TABLE - Missing columns
-- ============================================
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS from_location_id UUID REFERENCES locations(id);
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS to_location_id UUID REFERENCES locations(id);
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS transfer_type VARCHAR(50) NOT NULL;
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES users(id);
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES users(id);
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS received_by UUID REFERENCES users(id);
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS attachments JSONB;

-- ============================================
-- STOCK_TRANSFER_ITEMS TABLE - Missing columns
-- ============================================
ALTER TABLE stock_transfer_items ADD COLUMN IF NOT EXISTS requested_quantity INTEGER NOT NULL;
ALTER TABLE stock_transfer_items ADD COLUMN IF NOT EXISTS sent_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stock_transfer_items ADD COLUMN IF NOT EXISTS received_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stock_transfer_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- PRODUCTS TABLE - Missing columns
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS compatibility TEXT;

-- ============================================
-- SUPPLIER_PRODUCTS TABLE - Missing columns
-- ============================================
ALTER TABLE supplier_products ADD COLUMN IF NOT EXISTS supplier_sku VARCHAR(100);
ALTER TABLE supplier_products ADD COLUMN IF NOT EXISTS moq INTEGER NOT NULL DEFAULT 1;
ALTER TABLE supplier_products ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE supplier_products ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE supplier_products ADD COLUMN IF NOT EXISTS last_purchase_price DECIMAL(12,2);
ALTER TABLE supplier_products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ============================================
-- SUPPLIER_RETURNS TABLE - Missing columns
-- ============================================
ALTER TABLE supplier_returns ADD COLUMN IF NOT EXISTS return_type VARCHAR(50) NOT NULL;
ALTER TABLE supplier_returns ADD COLUMN IF NOT EXISTS reason_description TEXT;
ALTER TABLE supplier_returns ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE supplier_returns ADD COLUMN IF NOT EXISTS refund_method VARCHAR(50);
ALTER TABLE supplier_returns ADD COLUMN IF NOT EXISTS refund_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE supplier_returns ADD COLUMN IF NOT EXISTS replacement_issued BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE supplier_returns ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE supplier_returns ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE supplier_returns ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE supplier_returns ADD COLUMN IF NOT EXISTS attachments JSONB;

-- ============================================
-- SUPPLIER_RETURN_ITEMS TABLE - Missing columns
-- ============================================
ALTER TABLE supplier_return_items ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);
ALTER TABLE supplier_return_items ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);
ALTER TABLE supplier_return_items ADD COLUMN IF NOT EXISTS condition VARCHAR(50);
ALTER TABLE supplier_return_items ADD COLUMN IF NOT EXISTS images JSONB;
ALTER TABLE supplier_return_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- PRODUCT_STOCK_MOVEMENTS TABLE - Missing columns
-- ============================================
ALTER TABLE product_stock_movements ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE product_stock_movements ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);
ALTER TABLE product_stock_movements ADD COLUMN IF NOT EXISTS quantity_before INTEGER NOT NULL;
ALTER TABLE product_stock_movements ADD COLUMN IF NOT EXISTS quantity_after INTEGER NOT NULL;
ALTER TABLE product_stock_movements ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);
ALTER TABLE product_stock_movements ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(12,2);
ALTER TABLE product_stock_movements ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2);
ALTER TABLE product_stock_movements ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);
ALTER TABLE product_stock_movements ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);
ALTER TABLE product_stock_movements ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE product_stock_movements ADD COLUMN IF NOT EXISTS performed_by UUID REFERENCES users(id);
ALTER TABLE product_stock_movements ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE product_stock_movements ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- JOB_SHEET_PRODUCTS TABLE - Missing columns
-- ============================================
ALTER TABLE job_sheet_products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) NOT NULL;
ALTER TABLE job_sheet_products ADD COLUMN IF NOT EXISTS warranty_months INTEGER NOT NULL DEFAULT 0;
ALTER TABLE job_sheet_products ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);
ALTER TABLE job_sheet_products ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);
ALTER TABLE job_sheet_products ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'PENDING';
ALTER TABLE job_sheet_products ADD COLUMN IF NOT EXISTS installed_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_sheet_products ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- JOB_SHEET_PARTS TABLE - Missing columns
-- ============================================
ALTER TABLE job_sheet_parts ADD COLUMN IF NOT EXISTS warranty_months INTEGER NOT NULL DEFAULT 0;

-- ============================================
-- STOCK_MOVEMENTS TABLE - Missing columns (Parts related)
-- ============================================
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS part_id UUID;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- WARRANTY_CARDS TABLE - Missing columns
-- ============================================
ALTER TABLE warranty_cards ADD COLUMN IF NOT EXISTS product_sku VARCHAR(100);

-- ============================================
-- SMS_LOGS TABLE - Missing columns
-- ============================================
ALTER TABLE sms_logs ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL;
ALTER TABLE sms_logs ADD COLUMN IF NOT EXISTS recipient VARCHAR(50) NOT NULL;
ALTER TABLE sms_logs ADD COLUMN IF NOT EXISTS response TEXT;

-- ============================================
-- PRODUCT_RETURNS TABLE - Missing columns
-- ============================================
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS return_reason TEXT NOT NULL;
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS return_category VARCHAR(50) NOT NULL;
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS condition_notes TEXT;
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS inspected_by UUID REFERENCES users(id);
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS inspected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS inspection_notes TEXT;
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS resolution_type VARCHAR(50);
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS resolution_details TEXT;
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS resolution_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS sale_refund_id UUID REFERENCES sale_refunds(id);
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS supplier_return_id UUID REFERENCES supplier_returns(id);
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS stock_transfer_id UUID REFERENCES stock_transfers(id);
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS documents JSONB;
ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- NOTIFICATION_SETTINGS TABLE - Missing columns
-- ============================================
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS admin_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS manager_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS customer_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS staff_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS auto_send BOOLEAN NOT NULL DEFAULT true;

-- ============================================
-- Create indexes for new columns
-- ============================================
CREATE INDEX IF NOT EXISTS idx_payments_payment_number ON payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_sale_payments_payment_number ON sale_payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_sales_completed_at ON sales(completed_at);
CREATE INDEX IF NOT EXISTS idx_sales_cancelled_at ON sales(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_job_sheet ON notifications(job_sheet_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON activity_logs(module);
CREATE INDEX IF NOT EXISTS idx_activity_logs_record ON activity_logs(record_id);
