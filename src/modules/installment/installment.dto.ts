/**
 * Data Transfer Objects for Installment Payment System
 */

import { InstallmentFrequency, InstallmentPlanStatus, InstallmentPaymentStatus, PaymentMethod } from '../../enums';

// Customer Financial Details DTOs
export interface CreateCustomerFinancialDetailsDTO {
    customerId: string;
    nationalId: string;
    nationalIdIssuedDate?: Date;
    nationalIdExpiryDate?: Date;
    bankName: string;
    bankBranch?: string;
    accountNumber: string;
    accountHolderName?: string;
    swiftCode?: string;
    companyName: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    jobPosition?: string;
    monthlyIncome?: number;
    employmentStartDate?: Date;
    supervisorName?: string;
    supervisorPhone?: string;
    hasExistingLoans?: boolean;
    existingLoans?: Array<{
        lender: string;
        loanType: string;
        monthlyPayment: number;
        outstandingBalance: number;
    }>;
    totalMonthlyObligations?: number;
    creditScore?: string;
    creditRating?: string;
    notes?: string;
}

export interface UpdateCustomerFinancialDetailsDTO {
    nationalId?: string;
    nationalIdIssuedDate?: Date;
    nationalIdExpiryDate?: Date;
    bankName?: string;
    bankBranch?: string;
    accountNumber?: string;
    accountHolderName?: string;
    swiftCode?: string;
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    jobPosition?: string;
    monthlyIncome?: number;
    employmentStartDate?: Date;
    supervisorName?: string;
    supervisorPhone?: string;
    hasExistingLoans?: boolean;
    existingLoans?: Array<{
        lender: string;
        loanType: string;
        monthlyPayment: number;
        outstandingBalance: number;
    }>;
    totalMonthlyObligations?: number;
    creditScore?: string;
    creditRating?: string;
    notes?: string;
    isVerified?: boolean;
}

// Installment Plan DTOs
export interface CreateInstallmentPlanDTO {
    customerId: string;
    saleId?: string;
    productDescription?: string;
    totalAmount: number;
    downPayment: number;
    numberOfInstallments: number;
    frequency: InstallmentFrequency;
    interestRate?: number;
    lateFeePercentage?: number;
    lateFeeFixed?: number;
    startDate: Date;
    firstPaymentDate?: Date;
    termsAndConditions?: any;
    notes?: string;
    createdById?: string;
}

export interface UpdateInstallmentPlanDTO {
    status?: InstallmentPlanStatus;
    notes?: string;
    cancellationReason?: string;
}

export interface InstallmentPlanQueryDTO {
    customerId?: string;
    status?: InstallmentPlanStatus;
    page?: string;
    limit?: string;
    startDate?: string;
    endDate?: string;
}

// Installment Payment DTOs
export interface RecordPaymentDTO {
    installmentPaymentId: string;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    paymentDate?: Date;
    notes?: string;
    receivedById?: string;
}

export interface InstallmentPaymentQueryDTO {
    installmentPlanId?: string;
    status?: InstallmentPaymentStatus;
    overdue?: boolean;
    page?: string;
    limit?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
}

// Response DTOs
export interface InstallmentPlanWithPayments {
    id: string;
    planNumber: string;
    customer: {
        id: string;
        customerId: string;
        name: string;
        phone: string;
    };
    totalAmount: number;
    downPayment: number;
    financedAmount: number;
    numberOfInstallments: number;
    installmentAmount: number;
    frequency: InstallmentFrequency;
    status: InstallmentPlanStatus;
    totalPaid: number;
    totalOutstanding: number;
    paymentsCompleted: number;
    paymentsMissed: number;
    startDate: Date;
    endDate: Date;
    payments?: InstallmentPaymentSummary[];
}

export interface InstallmentPaymentSummary {
    id: string;
    paymentNumber: string;
    installmentNumber: number;
    dueDate: Date;
    amountDue: number;
    amountPaid: number;
    lateFee: number;
    status: InstallmentPaymentStatus;
    daysOverdue: number;
    paymentDate?: Date;
}

export interface InstallmentStatsDTO {
    totalPlans: number;
    activePlans: number;
    completedPlans: number;
    defaultedPlans: number;
    totalFinancedAmount: number;
    totalOutstanding: number;
    totalCollected: number;
    overduePayments: number;
    upcomingPayments: number;
}
