import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    CreatedAt,
    UpdatedAt,
    ForeignKey,
    BelongsTo,
    HasMany,
    Index,
} from 'sequelize-typescript';
import { Customer } from './customer.model';
import { Sale } from './sale.model';
import { User } from './user.model';
import { InstallmentPayment } from './installment-payment.model';
import { InstallmentFrequency, InstallmentPlanStatus } from '../enums';

@Table({
    tableName: 'installment_plans',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['customer_id', 'status'] },
        { fields: ['status', 'created_at'] },
    ],
})
export class InstallmentPlan extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id!: string;

    @Index
    @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'plan_number' })
    planNumber!: string;

    @Index
    @ForeignKey(() => Customer)
    @Column({ type: DataType.UUID, allowNull: false, field: 'customer_id' })
    customerId!: string;

    @BelongsTo(() => Customer)
    customer?: Customer;

    @ForeignKey(() => Sale)
    @Column({ type: DataType.UUID, field: 'sale_id' })
    saleId?: string;

    @BelongsTo(() => Sale)
    sale?: Sale;

    @Column({ type: DataType.STRING, field: 'product_description' })
    productDescription?: string;

    // Financial Details
    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'total_amount' })
    totalAmount!: number;

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'down_payment' })
    downPayment!: number;

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'financed_amount' })
    financedAmount!: number;

    @Column({ type: DataType.INTEGER, allowNull: false, field: 'number_of_installments' })
    numberOfInstallments!: number;

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'installment_amount' })
    installmentAmount!: number;

    @Column({
        type: DataType.ENUM(...Object.values(InstallmentFrequency)),
        allowNull: false,
        defaultValue: InstallmentFrequency.MONTHLY,
    })
    frequency!: InstallmentFrequency;

    @Column({ type: DataType.DECIMAL(5, 2), defaultValue: 0, field: 'interest_rate' })
    interestRate!: number;

    @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0, field: 'late_fee_percentage' })
    lateFeePercentage!: number;

    @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0, field: 'late_fee_fixed' })
    lateFeeFixed!: number;

    // Dates
    @Column({ type: DataType.DATE, allowNull: false, field: 'start_date' })
    startDate!: Date;

    @Column({ type: DataType.DATE, allowNull: false, field: 'end_date' })
    endDate!: Date;

    @Column({ type: DataType.DATE, field: 'first_payment_date' })
    firstPaymentDate!: Date;

    // Status
    @Index
    @Default(InstallmentPlanStatus.ACTIVE)
    @Column({
        type: DataType.ENUM(...Object.values(InstallmentPlanStatus)),
        allowNull: false,
    })
    status!: InstallmentPlanStatus;

    // Payment Tracking
    @Default(0)
    @Column({ type: DataType.DECIMAL(10, 2), field: 'total_paid' })
    totalPaid!: number;

    @Default(0)
    @Column({ type: DataType.DECIMAL(10, 2), field: 'total_outstanding' })
    totalOutstanding!: number;

    @Default(0)
    @Column({ type: DataType.INTEGER, field: 'payments_completed' })
    paymentsCompleted!: number;

    @Default(0)
    @Column({ type: DataType.INTEGER, field: 'payments_missed' })
    paymentsMissed!: number;

    // Metadata
    @Column(DataType.TEXT)
    notes?: string;

    @Column({ type: DataType.JSONB, field: 'terms_and_conditions' })
    termsAndConditions?: any;

    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, field: 'created_by_id' })
    createdById?: string;

    @BelongsTo(() => User, 'createdById')
    createdBy?: User;

    @Column({ type: DataType.DATE, field: 'completed_at' })
    completedAt?: Date;

    @Column({ type: DataType.DATE, field: 'cancelled_at' })
    cancelledAt?: Date;

    @Column({ type: DataType.STRING, field: 'cancellation_reason' })
    cancellationReason?: string;

    @CreatedAt
    @Column({ field: 'created_at' })
    createdAt!: Date;

    @UpdatedAt
    @Column({ field: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @HasMany(() => InstallmentPayment, { foreignKey: 'installment_plan_id', as: 'payments' })
    payments?: InstallmentPayment[];
}

export default InstallmentPlan;
