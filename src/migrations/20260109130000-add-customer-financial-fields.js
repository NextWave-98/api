'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        console.log('\n🔄 Adding financial detail fields to customers table...\n');

        await queryInterface.addColumn('customers', 'national_id_issue_date', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'national_id_expiry_date', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'bank_name', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'bank_branch', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'bank_account_number', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'bank_swift_code', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'company_name', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'company_address', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'company_contact', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'job_position', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'monthly_income', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'supervisor_name', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'supervisor_contact', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'existing_loans', {
            type: Sequelize.JSONB,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'credit_score', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'credit_rating', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('customers', 'financial_details_verified', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });

        await queryInterface.addColumn('customers', 'financial_details_verified_at', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        console.log('✅ Successfully added financial detail fields to customers table!\n');
    },

    async down(queryInterface, Sequelize) {
        console.log('\n🔄 Removing financial detail fields from customers table...\n');

        await queryInterface.removeColumn('customers', 'national_id_issue_date');
        await queryInterface.removeColumn('customers', 'national_id_expiry_date');
        await queryInterface.removeColumn('customers', 'bank_name');
        await queryInterface.removeColumn('customers', 'bank_branch');
        await queryInterface.removeColumn('customers', 'bank_account_number');
        await queryInterface.removeColumn('customers', 'bank_swift_code');
        await queryInterface.removeColumn('customers', 'company_name');
        await queryInterface.removeColumn('customers', 'company_address');
        await queryInterface.removeColumn('customers', 'company_contact');
        await queryInterface.removeColumn('customers', 'job_position');
        await queryInterface.removeColumn('customers', 'monthly_income');
        await queryInterface.removeColumn('customers', 'supervisor_name');
        await queryInterface.removeColumn('customers', 'supervisor_contact');
        await queryInterface.removeColumn('customers', 'existing_loans');
        await queryInterface.removeColumn('customers', 'credit_score');
        await queryInterface.removeColumn('customers', 'credit_rating');
        await queryInterface.removeColumn('customers', 'financial_details_verified');
        await queryInterface.removeColumn('customers', 'financial_details_verified_at');

        console.log('✅ Successfully removed financial detail fields from customers table!\n');
    }
};
