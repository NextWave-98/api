import { Request, Response } from 'express';
import { InstallmentService } from './installment.service';
import { InstallmentNotificationService } from './installment-notification.service';
import { AppError } from '../../shared/utils/app-error';

const installmentService = new InstallmentService();
const notificationService = new InstallmentNotificationService();

export class InstallmentController {
    /**
     * Add customer financial details
     * POST /api/installments/financial-details
     */
    async addFinancialDetails(req: Request, res: Response) {
        try {
            const financialDetails = await installmentService.addFinancialDetails(req.body);
            res.status(201).json({
                success: true,
                data: financialDetails,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                });
            }
        }
    }

    /**
     * Update customer financial details
     * PUT /api/installments/financial-details/:customerId
     */
    async updateFinancialDetails(req: Request, res: Response) {
        try {
            const { customerId } = req.params;
            const financialDetails = await installmentService.updateFinancialDetails(customerId, req.body);
            res.status(200).json({
                success: true,
                data: financialDetails,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                });
            }
        }
    }

    /**
     * Get customer financial details
     * GET /api/installments/financial-details/:customerId
     */
    async getFinancialDetails(req: Request, res: Response) {
        try {
            const { customerId } = req.params;
            const financialDetails = await installmentService.getFinancialDetails(customerId);
            res.status(200).json({
                success: true,
                data: financialDetails,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                });
            }
        }
    }

    /**
     * Create installment plan
     * POST /api/installments/plans
     */
    async createInstallmentPlan(req: Request, res: Response) {
        try {
            const plan = await installmentService.createInstallmentPlan(req.body);
            res.status(201).json({
                success: true,
                data: plan,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                });
            }
        }
    }

    /**
     * Get installment plan by ID
     * GET /api/installments/plans/:id
     */
    async getInstallmentPlanById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const plan = await installmentService.getInstallmentPlanById(id);
            res.status(200).json({
                success: true,
                data: plan,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                });
            }
        }
    }

    /**
     * Get all installment plans
     * GET /api/installments/plans
     */
    async getInstallmentPlans(req: Request, res: Response) {
        try {
            const result = await installmentService.getInstallmentPlans(req.query);
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Get customer installments
     * GET /api/installments/customer/:customerId
     */
    async getCustomerInstallments(req: Request, res: Response) {
        try {
            const { customerId } = req.params;
            const result = await installmentService.getInstallmentPlans({
                customerId,
                ...req.query,
            });
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Record payment
     * POST /api/installments/payments
     */
    async recordPayment(req: Request, res: Response) {
        try {
            const payment = await installmentService.recordPayment(req.body);

            // Send payment confirmation
            try {
                await notificationService.sendPaymentConfirmation(payment.id);
            } catch (notifError) {
                console.error('Failed to send payment confirmation:', notifError);
            }

            res.status(200).json({
                success: true,
                data: payment,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                });
            }
        }
    }

    /**
     * Get overdue payments
     * GET /api/installments/overdue
     */
    async getOverduePayments(req: Request, res: Response) {
        try {
            const result = await installmentService.getOverduePayments(req.query);
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Get installment statistics
     * GET /api/installments/stats
     */
    async getInstallmentStats(req: Request, res: Response) {
        try {
            const stats = await installmentService.getInstallmentStats();
            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Check late payments (manual trigger)
     * POST /api/installments/check-late-payments
     */
    async checkLatePayments(req: Request, res: Response) {
        try {
            const result = await installmentService.checkLatePayments();
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Process overdue notifications (manual trigger)
     * POST /api/installments/process-notifications
     */
    async processNotifications(req: Request, res: Response) {
        try {
            const result = await notificationService.processOverdueNotifications();
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }
}
