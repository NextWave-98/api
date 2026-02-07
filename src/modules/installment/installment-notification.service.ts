import { AppError } from '../../shared/utils/app-error';
import {
    InstallmentPayment,
    InstallmentPlan,
    Customer,
    CustomerFinancialDetails,
    Notification,
} from '../../models';
import { NotificationType, RecipientType, NotificationMethod } from '../../enums';
import { NotificationService } from '../notification/notification.service';

export class InstallmentNotificationService {
    private notificationService: NotificationService;

    constructor() {
        this.notificationService = new NotificationService();
    }

    /**
     * Send payment reminder to customer (before due date)
     */
    async sendPaymentReminder(paymentId: string) {
        const payment = await InstallmentPayment.findByPk(paymentId, {
            include: [
                {
                    model: InstallmentPlan,
                    as: 'installmentPlan',
                    include: [
                        {
                            model: Customer,
                            as: 'customer',
                        },
                    ],
                },
            ],
        });

        if (!payment) {
            throw new AppError(404, 'Payment not found');
        }

        const paymentData = payment.toJSON() as any;
        const plan = paymentData.installmentPlan;
        const customer = plan?.customer;

        if (!customer) {
            throw new AppError(404, 'Customer not found');
        }

        const dueDate = new Date(payment.dueDate).toLocaleDateString();
        const message = `Reminder: Your installment payment #${payment.installmentNumber} of Rs. ${payment.amountDue} for plan ${plan.planNumber} is due on ${dueDate}. Please make the payment on time to avoid late fees.`;

        await this.notificationService.createNotification({
            customerId: customer.id,
            type: NotificationType.INSTALLMENT_PAYMENT_DUE,
            title: 'Installment Payment Reminder',
            message,
            method: NotificationMethod.SMS,
            recipient: customer.phone,
            recipientType: RecipientType.CUSTOMER,
            priority: 'MEDIUM',
        });

        // Update reminder sent flag
        await payment.update({
            reminderSent: true,
            reminderSentAt: new Date(),
        });

        return { success: true, message: 'Reminder sent successfully' };
    }

    /**
     * Send late payment notification to customer
     */
    async sendLatePaymentNotification(paymentId: string) {
        const payment = await InstallmentPayment.findByPk(paymentId, {
            include: [
                {
                    model: InstallmentPlan,
                    as: 'installmentPlan',
                    include: [
                        {
                            model: Customer,
                            as: 'customer',
                        },
                    ],
                },
            ],
        });

        if (!payment) {
            throw new AppError(404, 'Payment not found');
        }

        const paymentData = payment.toJSON() as any;
        const plan = paymentData.installmentPlan;
        const customer = plan?.customer;

        if (!customer) {
            throw new AppError(404, 'Customer not found');
        }

        const message = `URGENT: Your installment payment #${payment.installmentNumber} of Rs. ${payment.amountDue} for plan ${plan.planNumber} is ${payment.daysOverdue} days overdue. Late fee of Rs. ${payment.lateFee} has been applied. Please pay immediately to avoid further action.`;

        await this.notificationService.createNotification({
            customerId: customer.id,
            type: NotificationType.INSTALLMENT_PAYMENT_LATE,
            title: 'Late Payment Notice',
            message,
            method: NotificationMethod.SMS,
            recipient: customer.phone,
            recipientType: RecipientType.CUSTOMER,
            priority: 'HIGH',
        });

        // Update late notification sent flag
        await payment.update({
            lateNotificationSent: true,
            lateNotificationSentAt: new Date(),
        });

        return { success: true, message: 'Late payment notification sent' };
    }

    /**
     * Send notification to owner about late payment
     */
    async sendOwnerNotification(paymentId: string) {
        const payment = await InstallmentPayment.findByPk(paymentId, {
            include: [
                {
                    model: InstallmentPlan,
                    as: 'installmentPlan',
                    include: [
                        {
                            model: Customer,
                            as: 'customer',
                        },
                    ],
                },
            ],
        });

        if (!payment) {
            throw new AppError(404, 'Payment not found');
        }

        const paymentData = payment.toJSON() as any;
        const plan = paymentData.installmentPlan;
        const customer = plan?.customer;

        if (!customer) {
            return;
        }

        const message = `Late Payment Alert: Customer ${customer.name} (${customer.customerId}) has a payment ${payment.daysOverdue} days overdue for plan ${plan.planNumber}. Amount: Rs. ${payment.amountDue}. Contact: ${customer.phone}`;

        // Get admin recipients
        const adminRecipients = await this.notificationService.getAdminRecipients();

        for (const admin of adminRecipients) {
            await this.notificationService.createNotification({
                recipientUserId: admin.id,
                type: NotificationType.INSTALLMENT_PAYMENT_LATE,
                title: 'Customer Late Payment Alert',
                message,
                method: NotificationMethod.EMAIL,
                recipient: admin.email,
                recipientType: RecipientType.ADMIN,
                priority: 'HIGH',
            });
        }

        // Update owner notified flag
        await payment.update({
            ownerNotified: true,
            ownerNotifiedAt: new Date(),
        });

        return { success: true, message: 'Owner notification sent' };
    }

    /**
     * Send notification to bank (after 1 month overdue)
     */
    async sendBankNotification(paymentId: string) {
        const payment = await InstallmentPayment.findByPk(paymentId, {
            include: [
                {
                    model: InstallmentPlan,
                    as: 'installmentPlan',
                    include: [
                        {
                            model: Customer,
                            as: 'customer',
                        },
                    ],
                },
            ],
        });

        if (!payment) {
            throw new AppError(404, 'Payment not found');
        }

        const paymentData = payment.toJSON() as any;
        const plan = paymentData.installmentPlan;
        const customer = plan?.customer;

        if (!customer) {
            return;
        }

        // Get customer financial details
        const financialDetails = await CustomerFinancialDetails.findOne({
            where: { customerId: customer.id },
        });

        if (!financialDetails) {
            console.warn(`No financial details found for customer ${customer.id}`);
            return;
        }

        const message = `Default Notice: Customer ${customer.name} (National ID: ${financialDetails.nationalId}) has defaulted on installment payment. Plan: ${plan.planNumber}, Overdue: ${payment.daysOverdue} days, Amount: Rs. ${payment.amountDue}. Bank: ${financialDetails.bankName}, Account: ${financialDetails.accountNumber}`;

        // Create notification record (actual sending would be handled by external system)
        await Notification.create({
            type: NotificationType.INSTALLMENT_DEFAULTED,
            title: 'Customer Default Notification - Bank',
            message,
            method: NotificationMethod.EMAIL,
            recipient: financialDetails.bankName, // In real system, this would be bank email
            recipientType: RecipientType.SYSTEM,
            priority: 'URGENT',
            status: 'PENDING',
            metadata: JSON.stringify({
                bankName: financialDetails.bankName,
                bankBranch: financialDetails.bankBranch,
                accountNumber: financialDetails.accountNumber,
                customerId: customer.id,
                nationalId: financialDetails.nationalId,
            }),
        });

        // Update bank notified flag
        await payment.update({
            bankNotified: true,
            bankNotifiedAt: new Date(),
        });

        return { success: true, message: 'Bank notification created' };
    }

    /**
     * Send notification to employer (after 1 month overdue)
     */
    async sendEmployerNotification(paymentId: string) {
        const payment = await InstallmentPayment.findByPk(paymentId, {
            include: [
                {
                    model: InstallmentPlan,
                    as: 'installmentPlan',
                    include: [
                        {
                            model: Customer,
                            as: 'customer',
                        },
                    ],
                },
            ],
        });

        if (!payment) {
            throw new AppError(404, 'Payment not found');
        }

        const paymentData = payment.toJSON() as any;
        const plan = paymentData.installmentPlan;
        const customer = plan?.customer;

        if (!customer) {
            return;
        }

        // Get customer financial details
        const financialDetails = await CustomerFinancialDetails.findOne({
            where: { customerId: customer.id },
        });

        if (!financialDetails) {
            console.warn(`No financial details found for customer ${customer.id}`);
            return;
        }

        const message = `Payment Default Notice: Your employee ${customer.name} (National ID: ${financialDetails.nationalId}) has defaulted on an installment payment for ${payment.daysOverdue} days. Amount overdue: Rs. ${payment.amountDue}. Please contact: ${customer.phone}`;

        // Create notification record
        await Notification.create({
            type: NotificationType.INSTALLMENT_DEFAULTED,
            title: 'Employee Payment Default Notification',
            message,
            method: NotificationMethod.EMAIL,
            recipient: financialDetails.companyEmail || financialDetails.companyName,
            recipientType: RecipientType.SYSTEM,
            priority: 'URGENT',
            status: 'PENDING',
            metadata: JSON.stringify({
                companyName: financialDetails.companyName,
                companyPhone: financialDetails.companyPhone,
                companyEmail: financialDetails.companyEmail,
                supervisorName: financialDetails.supervisorName,
                supervisorPhone: financialDetails.supervisorPhone,
                customerId: customer.id,
                nationalId: financialDetails.nationalId,
            }),
        });

        // Update employer notified flag
        await payment.update({
            employerNotified: true,
            employerNotifiedAt: new Date(),
        });

        return { success: true, message: 'Employer notification created' };
    }

    /**
     * Send payment confirmation to customer
     */
    async sendPaymentConfirmation(paymentId: string) {
        const payment = await InstallmentPayment.findByPk(paymentId, {
            include: [
                {
                    model: InstallmentPlan,
                    as: 'installmentPlan',
                    include: [
                        {
                            model: Customer,
                            as: 'customer',
                        },
                    ],
                },
            ],
        });

        if (!payment) {
            throw new AppError(404, 'Payment not found');
        }

        const paymentData = payment.toJSON() as any;
        const plan = paymentData.installmentPlan;
        const customer = plan?.customer;

        if (!customer) {
            return;
        }

        const paymentDate = payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'today';
        const message = `Payment Received: Thank you for your payment of Rs. ${payment.amountPaid} for installment #${payment.installmentNumber} on ${paymentDate}. Plan: ${plan.planNumber}. Remaining balance: Rs. ${plan.totalOutstanding}`;

        await this.notificationService.createNotification({
            customerId: customer.id,
            type: NotificationType.INSTALLMENT_PAYMENT_RECEIVED,
            title: 'Payment Confirmation',
            message,
            method: NotificationMethod.SMS,
            recipient: customer.phone,
            recipientType: RecipientType.CUSTOMER,
            priority: 'LOW',
        });

        return { success: true, message: 'Payment confirmation sent' };
    }

    /**
     * Send plan completion notification
     */
    async sendPlanCompletionNotification(planId: string) {
        const plan = await InstallmentPlan.findByPk(planId, {
            include: [
                {
                    model: Customer,
                    as: 'customer',
                },
            ],
        });

        if (!plan) {
            throw new AppError(404, 'Plan not found');
        }

        const planData = plan.toJSON() as any;
        const customer = planData.customer;

        if (!customer) {
            return;
        }

        const message = `Congratulations! You have successfully completed all payments for installment plan ${plan.planNumber}. Total amount paid: Rs. ${plan.totalPaid}. Thank you for your business!`;

        await this.notificationService.createNotification({
            customerId: customer.id,
            type: NotificationType.INSTALLMENT_PLAN_COMPLETED,
            title: 'Installment Plan Completed',
            message,
            method: NotificationMethod.SMS,
            recipient: customer.phone,
            recipientType: RecipientType.CUSTOMER,
            priority: 'MEDIUM',
        });

        return { success: true, message: 'Completion notification sent' };
    }

    /**
     * Process all notifications for overdue payments
     * Called by scheduled job
     */
    async processOverdueNotifications() {
        const today = new Date();
        const results = {
            reminders: 0,
            lateNotifications: 0,
            ownerNotifications: 0,
            bankNotifications: 0,
            employerNotifications: 0,
            errors: [] as string[],
        };

        // Get payments due in 3 days (for reminders)
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + 3);

        const paymentsForReminder = await InstallmentPayment.findAll({
            where: {
                status: 'PENDING',
                dueDate: {
                    $lte: reminderDate,
                    $gte: today,
                },
                reminderSent: false,
            },
        });

        for (const payment of paymentsForReminder) {
            try {
                await this.sendPaymentReminder(payment.id);
                results.reminders++;
            } catch (error: any) {
                results.errors.push(`Reminder failed for payment ${payment.id}: ${error.message}`);
            }
        }

        // Get late payments (not yet notified)
        const latePayments = await InstallmentPayment.findAll({
            where: {
                status: ['LATE', 'DEFAULTED'],
                lateNotificationSent: false,
                daysOverdue: {
                    $gt: 0,
                },
            },
        });

        for (const payment of latePayments) {
            try {
                await this.sendLatePaymentNotification(payment.id);
                results.lateNotifications++;

                // Notify owner if not already done
                if (!payment.ownerNotified) {
                    await this.sendOwnerNotification(payment.id);
                    results.ownerNotifications++;
                }

                // Notify bank and employer if 30+ days overdue
                if (payment.daysOverdue >= 30) {
                    if (!payment.bankNotified) {
                        await this.sendBankNotification(payment.id);
                        results.bankNotifications++;
                    }
                    if (!payment.employerNotified) {
                        await this.sendEmployerNotification(payment.id);
                        results.employerNotifications++;
                    }
                }
            } catch (error: any) {
                results.errors.push(`Late notification failed for payment ${payment.id}: ${error.message}`);
            }
        }

        return results;
    }
}
