'use strict';

/**
 * INSTALLMENT PAYMENT SYSTEM MIGRATION
 * Creates tables for customer financial details, installment plans, and installment payments
 */

module.exports = {
    async up(queryInterface, Sequelize) {
        console.log('🚀 Creating installment payment system tables...\\n');

        // Create enums
        await queryInterface.sequelize.query(`
      CREATE TYPE "InstallmentFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');
    `);
        console.log('  ✓ Created enum: InstallmentFrequency');

        await queryInterface.sequelize.query(`
      CREATE TYPE "InstallmentPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED');
    `);
        console.log('  ✓ Created enum: InstallmentPlanStatus');

        await queryInterface.sequelize.query(`
      CREATE TYPE "InstallmentPaymentStatus" AS ENUM ('PENDING', 'PAID', 'LATE', 'DEFAULTED');
    `);
        console.log('  ✓ Created enum: InstallmentPaymentStatus');

        // Add new notification types to existing enum
        await queryInterface.sequelize.query(`
      ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INSTALLMENT_PAYMENT_DUE';
      ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INSTALLMENT_PAYMENT_LATE';
      ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INSTALLMENT_PAYMENT_RECEIVED';
      ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INSTALLMENT_DEFAULTED';
      ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INSTALLMENT_PLAN_CREATED';
      ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INSTALLMENT_PLAN_COMPLETED';
    `);
        console.log('  ✓ Added installment notification types to NotificationType enum');

        // Create customer_financial_details table
        await queryInterface.createTable('customer_financial_details', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            customer_id: {
                type: Sequelize.UUID,
                allowNull: false,
                unique: true,
                references: {
                    model: 'customers',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            // National ID
            national_id: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            national_id_issued_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            national_id_expiry_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            // Bank Details
            bank_name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            bank_branch: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            account_number: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            account_holder_name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            swift_code: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            // Employment Details
            company_name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            company_address: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            company_phone: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            company_email: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            job_position: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            monthly_income: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            employment_start_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            supervisor_name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            supervisor_phone: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            // Existing Loans
            has_existing_loans: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            existing_loans: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            total_monthly_obligations: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            // Credit Information
            credit_score: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            credit_rating: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            // Additional Information
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            is_verified: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            },
            verified_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            verified_by_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });
        console.log('  ✓ Created table: customer_financial_details');

        // Create indexes for customer_financial_details
        await queryInterface.addIndex('customer_financial_details', ['customer_id']);
        await queryInterface.addIndex('customer_financial_details', ['national_id']);
        console.log('  ✓ Created indexes for customer_financial_details');

        // Create installment_plans table
        await queryInterface.createTable('installment_plans', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            plan_number: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            customer_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            sale_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'sales',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            product_description: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            // Financial Details
            total_amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            down_payment: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            financed_amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            number_of_installments: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            installment_amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            frequency: {
                type: Sequelize.ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY'),
                allowNull: false,
                defaultValue: 'MONTHLY',
            },
            interest_rate: {
                type: Sequelize.DECIMAL(5, 2),
                defaultValue: 0,
                allowNull: false,
            },
            late_fee_percentage: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
                allowNull: false,
            },
            late_fee_fixed: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
                allowNull: false,
            },
            // Dates
            start_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            end_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            first_payment_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            // Status
            status: {
                type: Sequelize.ENUM('ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED'),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },
            // Payment Tracking
            total_paid: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
                allowNull: false,
            },
            total_outstanding: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
                allowNull: false,
            },
            payments_completed: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
            payments_missed: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
            // Metadata
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            terms_and_conditions: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            created_by_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            completed_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            cancelled_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            cancellation_reason: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });
        console.log('  ✓ Created table: installment_plans');

        // Create indexes for installment_plans
        await queryInterface.addIndex('installment_plans', ['plan_number']);
        await queryInterface.addIndex('installment_plans', ['customer_id', 'status']);
        await queryInterface.addIndex('installment_plans', ['status', 'created_at']);
        console.log('  ✓ Created indexes for installment_plans');

        // Create installment_payments table
        await queryInterface.createTable('installment_payments', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            payment_number: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            installment_plan_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'installment_plans',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            installment_number: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            // Payment Details
            due_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            amount_due: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            amount_paid: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
                allowNull: false,
            },
            late_fee: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
                allowNull: false,
            },
            total_amount_paid: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
                allowNull: false,
            },
            payment_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            payment_method: {
                type: Sequelize.ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'OTHER'),
                allowNull: true,
            },
            payment_reference: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            // Status
            status: {
                type: Sequelize.ENUM('PENDING', 'PAID', 'LATE', 'DEFAULTED'),
                allowNull: false,
                defaultValue: 'PENDING',
            },
            days_overdue: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
            overdue_since: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            // Notifications
            reminder_sent: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            reminder_sent_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            late_notification_sent: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            late_notification_sent_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            owner_notified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            owner_notified_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            bank_notified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            bank_notified_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            employer_notified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            employer_notified_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            // Metadata
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            received_by_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });
        console.log('  ✓ Created table: installment_payments');

        // Create indexes for installment_payments
        await queryInterface.addIndex('installment_payments', ['payment_number']);
        await queryInterface.addIndex('installment_payments', ['installment_plan_id', 'status']);
        await queryInterface.addIndex('installment_payments', ['due_date', 'status']);
        await queryInterface.addIndex('installment_payments', ['status', 'days_overdue']);
        console.log('  ✓ Created indexes for installment_payments');

        console.log('\\n✅ Installment payment system tables created successfully!');
    },

    async down(queryInterface, Sequelize) {
        console.log('🔄 Rolling back installment payment system tables...\\n');

        // Drop tables in reverse order
        await queryInterface.dropTable('installment_payments');
        console.log('  ✓ Dropped table: installment_payments');

        await queryInterface.dropTable('installment_plans');
        console.log('  ✓ Dropped table: installment_plans');

        await queryInterface.dropTable('customer_financial_details');
        console.log('  ✓ Dropped table: customer_financial_details');

        // Drop enums
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "InstallmentPaymentStatus";');
        console.log('  ✓ Dropped enum: InstallmentPaymentStatus');

        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "InstallmentPlanStatus";');
        console.log('  ✓ Dropped enum: InstallmentPlanStatus');

        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "InstallmentFrequency";');
        console.log('  ✓ Dropped enum: InstallmentFrequency');

        console.log('\\n✅ Installment payment system rollback complete!');
    },
};
