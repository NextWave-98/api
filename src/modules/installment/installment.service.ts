import { AppError } from '../../shared/utils/app-error';
import {
    CreateInstallmentPlanDTO,
    UpdateInstallmentPlanDTO,
    InstallmentPlanQueryDTO,
    RecordPaymentDTO,
    InstallmentPaymentQueryDTO,
    CreateCustomerFinancialDetailsDTO,
    UpdateCustomerFinancialDetailsDTO,
} from './installment.dto';
import {
    InstallmentPlan,
    InstallmentPayment,
    CustomerFinancialDetails,
    Customer,
    Sale,
    User,
} from '../../models';
import { Op } from 'sequelize';
import { InstallmentPlanStatus, InstallmentPaymentStatus, InstallmentFrequency } from '../../enums';

export class InstallmentService {
    /**
     * Generate next plan number in format INS0001, INS0002, etc.
     */
    private async generatePlanNumber(): Promise<string> {
        const lastPlan = await InstallmentPlan.findOne({
            order: [['createdAt', 'DESC']],
            attributes: ['planNumber'],
        });

        if (!lastPlan) {
            return 'INS0001';
        }

        const lastNumber = parseInt(lastPlan.planNumber.replace('INS', ''), 10);
        const nextNumber = lastNumber + 1;
        return `INS${nextNumber.toString().padStart(4, '0')}`;
    }

    /**
     * Generate payment number in format PAY0001, PAY0002, etc.
     */
    private async generatePaymentNumber(): Promise<string> {
        const lastPayment = await InstallmentPayment.findOne({
            order: [['createdAt', 'DESC']],
            attributes: ['paymentNumber'],
        });

        if (!lastPayment) {
            return 'PAY0001';
        }

        const lastNumber = parseInt(lastPayment.paymentNumber.replace('PAY', ''), 10);
        const nextNumber = lastNumber + 1;
        return `PAY${nextNumber.toString().padStart(4, '0')}`;
    }

    /**
     * Calculate next payment date based on frequency
     */
    private calculateNextPaymentDate(currentDate: Date, frequency: InstallmentFrequency): Date {
        const nextDate = new Date(currentDate);

        switch (frequency) {
            case InstallmentFrequency.WEEKLY:
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case InstallmentFrequency.BIWEEKLY:
                nextDate.setDate(nextDate.getDate() + 14);
                break;
            case InstallmentFrequency.MONTHLY:
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
        }

        return nextDate;
    }

    /**
     * Add or update customer financial details
     */
    async addFinancialDetails(data: CreateCustomerFinancialDetailsDTO) {
        // Verify customer exists
        const customer = await Customer.findByPk(data.customerId);
        if (!customer) {
            throw new AppError(404, 'Customer not found');
        }

        // Check if financial details already exist
        const existing = await CustomerFinancialDetails.findOne({
            where: { customerId: data.customerId },
        });

        if (existing) {
            throw new AppError(400, 'Financial details already exist for this customer. Use update endpoint.');
        }

        // Check for duplicate national ID
        const duplicateNationalId = await CustomerFinancialDetails.findOne({
            where: { nationalId: data.nationalId },
        });

        if (duplicateNationalId) {
            throw new AppError(400, 'National ID already registered');
        }

        const financialDetails = await CustomerFinancialDetails.create(data as any);
        return financialDetails.toJSON();
    }

    /**
     * Update customer financial details
     */
    async updateFinancialDetails(customerId: string, data: UpdateCustomerFinancialDetailsDTO) {
        const financialDetails = await CustomerFinancialDetails.findOne({
            where: { customerId },
        });

        if (!financialDetails) {
            throw new AppError(404, 'Financial details not found');
        }

        // Check for duplicate national ID if updating
        if (data.nationalId && data.nationalId !== financialDetails.nationalId) {
            const duplicate = await CustomerFinancialDetails.findOne({
                where: {
                    nationalId: data.nationalId,
                    customerId: { [Op.ne]: customerId },
                },
            });

            if (duplicate) {
                throw new AppError(400, 'National ID already registered');
            }
        }

        await financialDetails.update(data);
        return financialDetails.toJSON();
    }

    /**
     * Get customer financial details
     */
    async getFinancialDetails(customerId: string) {
        const financialDetails = await CustomerFinancialDetails.findOne({
            where: { customerId },
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'customerId', 'name', 'phone', 'email'],
                },
            ],
        });

        if (!financialDetails) {
            throw new AppError(404, 'Financial details not found');
        }

        return financialDetails.toJSON();
    }

    /**
     * Create a new installment plan
     */
    async createInstallmentPlan(data: CreateInstallmentPlanDTO) {
        // Verify customer exists
        const customer = await Customer.findByPk(data.customerId);
        if (!customer) {
            throw new AppError(404, 'Customer not found');
        }

        // Verify customer has financial details
        const financialDetails = await CustomerFinancialDetails.findOne({
            where: { customerId: data.customerId },
        });

        if (!financialDetails) {
            throw new AppError(400, 'Customer must have financial details before creating installment plan');
        }

        // Verify sale if provided
        if (data.saleId) {
            const sale = await Sale.findByPk(data.saleId);
            if (!sale) {
                throw new AppError(404, 'Sale not found');
            }
        }

        // Calculate financed amount
        const financedAmount = data.totalAmount - data.downPayment;

        // Calculate installment amount (simple calculation, can be enhanced with interest)
        let installmentAmount = financedAmount / data.numberOfInstallments;

        // Add interest if applicable
        if (data.interestRate && data.interestRate > 0) {
            const monthlyRate = data.interestRate / 100 / 12;
            const months = data.numberOfInstallments;
            // Simple interest calculation
            installmentAmount = (financedAmount * (1 + (monthlyRate * months))) / months;
        }

        // Round to 2 decimal places
        installmentAmount = Math.round(installmentAmount * 100) / 100;

        // Calculate dates
        const startDate = new Date(data.startDate);
        const firstPaymentDate = data.firstPaymentDate ? new Date(data.firstPaymentDate) : this.calculateNextPaymentDate(startDate, data.frequency);

        // Calculate end date
        let endDate = new Date(firstPaymentDate);
        for (let i = 1; i < data.numberOfInstallments; i++) {
            endDate = this.calculateNextPaymentDate(endDate, data.frequency);
        }

        // Generate plan number
        const planNumber = await this.generatePlanNumber();

        // Create installment plan
        const plan = await InstallmentPlan.create({
            planNumber,
            customerId: data.customerId,
            saleId: data.saleId,
            productDescription: data.productDescription,
            totalAmount: data.totalAmount,
            downPayment: data.downPayment,
            financedAmount,
            numberOfInstallments: data.numberOfInstallments,
            installmentAmount,
            frequency: data.frequency,
            interestRate: data.interestRate || 0,
            lateFeePercentage: data.lateFeePercentage || 0,
            lateFeeFixed: data.lateFeeFixed || 0,
            startDate,
            endDate,
            firstPaymentDate,
            status: InstallmentPlanStatus.ACTIVE,
            totalPaid: 0,
            totalOutstanding: financedAmount,
            paymentsCompleted: 0,
            paymentsMissed: 0,
            termsAndConditions: data.termsAndConditions,
            notes: data.notes,
            createdById: data.createdById,
        });

        // Create individual payment records
        let currentDueDate = new Date(firstPaymentDate);
        for (let i = 1; i <= data.numberOfInstallments; i++) {
            const paymentNumber = await this.generatePaymentNumber();

            await InstallmentPayment.create({
                paymentNumber,
                installmentPlanId: plan.id,
                installmentNumber: i,
                dueDate: new Date(currentDueDate),
                amountDue: installmentAmount,
                amountPaid: 0,
                lateFee: 0,
                totalAmountPaid: 0,
                status: InstallmentPaymentStatus.PENDING,
                daysOverdue: 0,
            });

            currentDueDate = this.calculateNextPaymentDate(currentDueDate, data.frequency);
        }

        // Fetch plan with payments
        const createdPlan = await InstallmentPlan.findByPk(plan.id, {
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'customerId', 'name', 'phone', 'email'],
                },
                {
                    model: InstallmentPayment,
                    as: 'payments',
                    order: [['installmentNumber', 'ASC']],
                },
            ],
        });

        return createdPlan?.toJSON();
    }

    /**
     * Get installment plan by ID
     */
    async getInstallmentPlanById(id: string) {
        const plan = await InstallmentPlan.findByPk(id, {
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'customerId', 'name', 'phone', 'email'],
                },
                {
                    model: Sale,
                    as: 'sale',
                    attributes: ['id', 'saleNumber', 'totalAmount'],
                },
                {
                    model: InstallmentPayment,
                    as: 'payments',
                    order: [['installmentNumber', 'ASC']],
                },
                {
                    model: User,
                    as: 'createdBy',
                    attributes: ['id', 'name', 'email'],
                },
            ],
        });

        if (!plan) {
            throw new AppError(404, 'Installment plan not found');
        }

        return plan.toJSON();
    }

    /**
     * Get all installment plans with filters
     */
    async getInstallmentPlans(query: InstallmentPlanQueryDTO) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '10');
        const skip = (page - 1) * limit;

        const where: any = {};

        if (query.customerId) {
            where.customerId = query.customerId;
        }

        if (query.status) {
            where.status = query.status;
        }

        if (query.startDate || query.endDate) {
            where.startDate = {};
            if (query.startDate) {
                where.startDate[Op.gte] = new Date(query.startDate);
            }
            if (query.endDate) {
                where.startDate[Op.lte] = new Date(query.endDate);
            }
        }

        const [plans, total] = await Promise.all([
            InstallmentPlan.findAll({
                where,
                offset: skip,
                limit,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: Customer,
                        as: 'customer',
                        attributes: ['id', 'customerId', 'name', 'phone'],
                    },
                ],
            }),
            InstallmentPlan.count({ where }),
        ]);

        return {
            plans: plans.map(p => p.toJSON()),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Record an installment payment
     */
    async recordPayment(data: RecordPaymentDTO) {
        const payment = await InstallmentPayment.findByPk(data.installmentPaymentId, {
            include: [
                {
                    model: InstallmentPlan,
                    as: 'installmentPlan',
                },
            ],
        });

        if (!payment) {
            throw new AppError(404, 'Installment payment not found');
        }

        if (payment.status === InstallmentPaymentStatus.PAID) {
            throw new AppError(400, 'Payment already completed');
        }

        const paymentData = payment.toJSON() as any;
        const plan = paymentData.installmentPlan;

        // Update payment record
        const paymentDate = data.paymentDate || new Date();
        const totalPaid = payment.amountPaid + data.amountPaid;

        await payment.update({
            amountPaid: totalPaid,
            totalAmountPaid: totalPaid + payment.lateFee,
            paymentDate,
            paymentMethod: data.paymentMethod,
            paymentReference: data.paymentReference,
            status: totalPaid >= payment.amountDue ? InstallmentPaymentStatus.PAID : payment.status,
            notes: data.notes,
            receivedById: data.receivedById,
        });

        // Update plan totals
        if (plan) {
            const updatedPlan = await InstallmentPlan.findByPk(plan.id);
            if (updatedPlan) {
                const newTotalPaid = updatedPlan.totalPaid + data.amountPaid;
                const newOutstanding = updatedPlan.financedAmount - newTotalPaid;
                const paymentsCompleted = totalPaid >= payment.amountDue
                    ? updatedPlan.paymentsCompleted + 1
                    : updatedPlan.paymentsCompleted;

                await updatedPlan.update({
                    totalPaid: newTotalPaid,
                    totalOutstanding: newOutstanding,
                    paymentsCompleted,
                    status: paymentsCompleted === updatedPlan.numberOfInstallments
                        ? InstallmentPlanStatus.COMPLETED
                        : updatedPlan.status,
                    completedAt: paymentsCompleted === updatedPlan.numberOfInstallments
                        ? new Date()
                        : updatedPlan.completedAt,
                });
            }
        }

        return payment.toJSON();
    }

    /**
     * Get overdue installment payments
     */
    async getOverduePayments(query: InstallmentPaymentQueryDTO) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '10');
        const skip = (page - 1) * limit;

        const where: any = {
            status: {
                [Op.in]: [InstallmentPaymentStatus.PENDING, InstallmentPaymentStatus.LATE],
            },
            dueDate: {
                [Op.lt]: new Date(),
            },
        };

        if (query.installmentPlanId) {
            where.installmentPlanId = query.installmentPlanId;
        }

        const [payments, total] = await Promise.all([
            InstallmentPayment.findAll({
                where,
                offset: skip,
                limit,
                order: [['dueDate', 'ASC']],
                include: [
                    {
                        model: InstallmentPlan,
                        as: 'installmentPlan',
                        include: [
                            {
                                model: Customer,
                                as: 'customer',
                                attributes: ['id', 'customerId', 'name', 'phone', 'email'],
                            },
                        ],
                    },
                ],
            }),
            InstallmentPayment.count({ where }),
        ]);

        return {
            payments: payments.map(p => p.toJSON()),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Update payment status and calculate overdue days
     * This should be called by a scheduled job
     */
    async checkLatePayments() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find all pending payments that are past due
        const overduePayments = await InstallmentPayment.findAll({
            where: {
                status: {
                    [Op.in]: [InstallmentPaymentStatus.PENDING, InstallmentPaymentStatus.LATE],
                },
                dueDate: {
                    [Op.lt]: today,
                },
            },
            include: [
                {
                    model: InstallmentPlan,
                    as: 'installmentPlan',
                },
            ],
        });

        const updates = [];

        for (const payment of overduePayments) {
            const dueDate = new Date(payment.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            // Calculate late fee
            const paymentData = payment.toJSON() as any;
            const plan = paymentData.installmentPlan;
            let lateFee = 0;

            if (plan) {
                if (plan.lateFeeFixed > 0) {
                    lateFee = plan.lateFeeFixed;
                } else if (plan.lateFeePercentage > 0) {
                    lateFee = (payment.amountDue * plan.lateFeePercentage) / 100;
                }
            }

            // Determine status based on days overdue
            let status = InstallmentPaymentStatus.LATE;
            if (daysOverdue >= 30) {
                status = InstallmentPaymentStatus.DEFAULTED;
            }

            await payment.update({
                daysOverdue,
                lateFee,
                status,
                overdueSince: payment.overdueSince || dueDate,
            });

            updates.push({
                paymentId: payment.id,
                daysOverdue,
                status,
                lateFee,
            });
        }

        return {
            checked: overduePayments.length,
            updates,
        };
    }

    /**
     * Get installment statistics
     */
    async getInstallmentStats() {
        const [
            totalPlans,
            activePlans,
            completedPlans,
            defaultedPlans,
            overduePayments,
        ] = await Promise.all([
            InstallmentPlan.count(),
            InstallmentPlan.count({ where: { status: InstallmentPlanStatus.ACTIVE } }),
            InstallmentPlan.count({ where: { status: InstallmentPlanStatus.COMPLETED } }),
            InstallmentPlan.count({ where: { status: InstallmentPlanStatus.DEFAULTED } }),
            InstallmentPayment.count({
                where: {
                    status: {
                        [Op.in]: [InstallmentPaymentStatus.LATE, InstallmentPaymentStatus.DEFAULTED],
                    },
                },
            }),
        ]);

        // Calculate financial stats
        const plans = await InstallmentPlan.findAll({
            attributes: ['financedAmount', 'totalPaid', 'totalOutstanding'],
        });

        const totalFinancedAmount = plans.reduce((sum, p) => sum + Number(p.financedAmount), 0);
        const totalCollected = plans.reduce((sum, p) => sum + Number(p.totalPaid), 0);
        const totalOutstanding = plans.reduce((sum, p) => sum + Number(p.totalOutstanding), 0);

        // Get upcoming payments (next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const upcomingPayments = await InstallmentPayment.count({
            where: {
                status: InstallmentPaymentStatus.PENDING,
                dueDate: {
                    [Op.between]: [new Date(), nextWeek],
                },
            },
        });

        return {
            totalPlans,
            activePlans,
            completedPlans,
            defaultedPlans,
            totalFinancedAmount,
            totalOutstanding,
            totalCollected,
            overduePayments,
            upcomingPayments,
        };
    }
}
