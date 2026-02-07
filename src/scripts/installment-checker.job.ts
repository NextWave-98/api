/**
 * Scheduled Job: Installment Payment Checker
 * Runs daily to check for late payments and send notifications
 * 
 * Usage: node -r ts-node/register src/scripts/installment-checker.job.ts
 * Or add to cron: 0 9 * * * (runs daily at 9 AM)
 */

import { InstallmentService } from '../modules/installment/installment.service';
import { InstallmentNotificationService } from '../modules/installment/installment-notification.service';
import { sequelize } from '../config/database';

const installmentService = new InstallmentService();
const notificationService = new InstallmentNotificationService();

async function runInstallmentChecker() {
    console.log('🔄 Starting installment payment checker...');
    console.log(`⏰ Run time: ${new Date().toLocaleString()}`);
    console.log('');

    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Step 1: Check and update late payments
        console.log('\\n📊 Checking for late payments...');
        const latePaymentResult = await installmentService.checkLatePayments();
        console.log(`   ✓ Checked ${latePaymentResult.checked} payments`);
        console.log(`   ✓ Updated ${latePaymentResult.updates.length} overdue payments`);

        // Step 2: Process notifications
        console.log('\\n📧 Processing notifications...');
        const notificationResult = await notificationService.processOverdueNotifications();

        console.log(`   ✓ Sent ${notificationResult.reminders} payment reminders`);
        console.log(`   ✓ Sent ${notificationResult.lateNotifications} late payment notifications`);
        console.log(`   ✓ Sent ${notificationResult.ownerNotifications} owner notifications`);
        console.log(`   ✓ Sent ${notificationResult.bankNotifications} bank notifications`);
        console.log(`   ✓ Sent ${notificationResult.employerNotifications} employer notifications`);

        if (notificationResult.errors.length > 0) {
            console.log(`\\n⚠️  Errors encountered:`);
            notificationResult.errors.forEach(error => {
                console.log(`   - ${error}`);
            });
        }

        console.log('\\n✅ Installment payment checker completed successfully!');
        console.log('');

        // Close database connection
        await sequelize.close();
        process.exit(0);
    } catch (error: any) {
        console.error('\\n❌ Error running installment checker:', error.message);
        console.error(error.stack);

        try {
            await sequelize.close();
        } catch (closeError) {
            console.error('Error closing database connection:', closeError);
        }

        process.exit(1);
    }
}

// Run the job
runInstallmentChecker();
