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
    Index,
} from 'sequelize-typescript';
import { InstallmentPlan } from './installment-plan.model';
import { User } from './user.model';
import { InstallmentPaymentStatus, PaymentMethod } from '../enums';

@Table({
    tableName: 'installment_payments',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['installment_plan_id', 'status'] },
        { fields: ['due_date', 'status'] },
        { fields: ['status', 'days_overdue'] },
    ],
})
export class InstallmentPayment extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id!: string;

    @Index
    @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'payment_number' })
    paymentNumber!: string;

    @Index
    @ForeignKey(() => InstallmentPlan)
    @Column({ type: DataType.UUID, allowNull: false, field: 'installment_plan_id' })
    installmentPlanId!: string;

    @BelongsTo(() => InstallmentPlan)
    installmentPlan?: InstallmentPlan;

    @Column({ type: DataType.INTEGER, allowNull: false, field: 'installment_number' })
    installmentNumber!: number;

    // Payment Details
    @Column({ type: DataType.DATE, allowNull: false, field: 'due_date' })
    dueDate!: Date;

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'amount_due' })
    amountDue!: number;

    @Default(0)
    @Column({ type: DataType.DECIMAL(10, 2), field: 'amount_paid' })
    amountPaid!: number;

    @Default(0)
    @Column({ type: DataType.DECIMAL(10, 2), field: 'late_fee' })
    lateFee!: number;

    @Default(0)
    @Column({ type: DataType.DECIMAL(10, 2), field: 'total_amount_paid' })
    totalAmountPaid!: number;

    @Column({ type: DataType.DATE, field: 'payment_date' })
    paymentDate?: Date;

    @Column({
        type: DataType.ENUM(...Object.values(PaymentMethod)),
        field: 'payment_method',
    })
    paymentMethod?: PaymentMethod;

    @Column({ type: DataType.STRING, field: 'payment_reference' })
    paymentReference?: string;

    // Status
    @Index
    @Default(InstallmentPaymentStatus.PENDING)
    @Column({
        type: DataType.ENUM(...Object.values(InstallmentPaymentStatus)),
        allowNull: false,
    })
    status!: InstallmentPaymentStatus;

    @Default(0)
    @Column({ type: DataType.INTEGER, field: 'days_overdue' })
    daysOverdue!: number;

    @Column({ type: DataType.DATE, field: 'overdue_since' })
    overdueSince?: Date;

    // Notifications
    @Default(false)
    @Column({ type: DataType.BOOLEAN, field: 'reminder_sent' })
    reminderSent!: boolean;

    @Column({ type: DataType.DATE, field: 'reminder_sent_at' })
    reminderSentAt?: Date;

    @Default(false)
    @Column({ type: DataType.BOOLEAN, field: 'late_notification_sent' })
    lateNotificationSent!: boolean;

    @Column({ type: DataType.DATE, field: 'late_notification_sent_at' })
    lateNotificationSentAt?: Date;

    @Default(false)
    @Column({ type: DataType.BOOLEAN, field: 'owner_notified' })
    ownerNotified!: boolean;

    @Column({ type: DataType.DATE, field: 'owner_notified_at' })
    ownerNotifiedAt?: Date;

    @Default(false)
    @Column({ type: DataType.BOOLEAN, field: 'bank_notified' })
    bankNotified!: boolean;

    @Column({ type: DataType.DATE, field: 'bank_notified_at' })
    bankNotifiedAt?: Date;

    @Default(false)
    @Column({ type: DataType.BOOLEAN, field: 'employer_notified' })
    employerNotified!: boolean;

    @Column({ type: DataType.DATE, field: 'employer_notified_at' })
    employerNotifiedAt?: Date;

    // Metadata
    @Column(DataType.TEXT)
    notes?: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, field: 'received_by_id' })
    receivedById?: string;

    @BelongsTo(() => User, 'receivedById')
    receivedBy?: User;

    @CreatedAt
    @Column({ field: 'created_at' })
    createdAt!: Date;

    @UpdatedAt
    @Column({ field: 'updated_at' })
    updatedAt!: Date;
}

export default InstallmentPayment;
