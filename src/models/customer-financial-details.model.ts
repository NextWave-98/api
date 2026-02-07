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
import { Customer } from './customer.model';

@Table({
    tableName: 'customer_financial_details',
    timestamps: true,
    underscored: true,
})
export class CustomerFinancialDetails extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id!: string;

    @Index
    @ForeignKey(() => Customer)
    @Column({ type: DataType.UUID, allowNull: false, unique: true, field: 'customer_id' })
    customerId!: string;

    @BelongsTo(() => Customer)
    customer?: Customer;

    // National ID
    @Index
    @Column({ type: DataType.STRING, allowNull: false, unique: true, field: 'national_id' })
    nationalId!: string;

    @Column({ type: DataType.DATE, field: 'national_id_issued_date' })
    nationalIdIssuedDate?: Date;

    @Column({ type: DataType.DATE, field: 'national_id_expiry_date' })
    nationalIdExpiryDate?: Date;

    // Bank Details
    @Column({ type: DataType.STRING, allowNull: false, field: 'bank_name' })
    bankName!: string;

    @Column({ type: DataType.STRING, field: 'bank_branch' })
    bankBranch?: string;

    @Column({ type: DataType.STRING, allowNull: false, field: 'account_number' })
    accountNumber!: string;

    @Column({ type: DataType.STRING, field: 'account_holder_name' })
    accountHolderName?: string;

    @Column({ type: DataType.STRING, field: 'swift_code' })
    swiftCode?: string;

    // Employment Details
    @Column({ type: DataType.STRING, allowNull: false, field: 'company_name' })
    companyName!: string;

    @Column({ type: DataType.STRING, field: 'company_address' })
    companyAddress?: string;

    @Column({ type: DataType.STRING, field: 'company_phone' })
    companyPhone?: string;

    @Column({ type: DataType.STRING, field: 'company_email' })
    companyEmail?: string;

    @Column({ type: DataType.STRING, field: 'job_position' })
    jobPosition?: string;

    @Column({ type: DataType.DECIMAL(10, 2), field: 'monthly_income' })
    monthlyIncome?: number;

    @Column({ type: DataType.DATE, field: 'employment_start_date' })
    employmentStartDate?: Date;

    @Column({ type: DataType.STRING, field: 'supervisor_name' })
    supervisorName?: string;

    @Column({ type: DataType.STRING, field: 'supervisor_phone' })
    supervisorPhone?: string;

    // Existing Loans
    @Column({ type: DataType.BOOLEAN, defaultValue: false, field: 'has_existing_loans' })
    hasExistingLoans!: boolean;

    @Column({ type: DataType.JSONB, field: 'existing_loans' })
    existingLoans?: {
        lender: string;
        loanType: string;
        monthlyPayment: number;
        outstandingBalance: number;
    }[];

    @Column({ type: DataType.DECIMAL(10, 2), field: 'total_monthly_obligations' })
    totalMonthlyObligations?: number;

    // Credit Information
    @Column({ type: DataType.STRING, field: 'credit_score' })
    creditScore?: string;

    @Column({ type: DataType.STRING, field: 'credit_rating' })
    creditRating?: string;

    // Additional Information
    @Column(DataType.TEXT)
    notes?: string;

    @Default(true)
    @Column({ type: DataType.BOOLEAN, field: 'is_verified' })
    isVerified!: boolean;

    @Column({ type: DataType.DATE, field: 'verified_at' })
    verifiedAt?: Date;

    @Column({ type: DataType.UUID, field: 'verified_by_id' })
    verifiedById?: string;

    @CreatedAt
    @Column({ field: 'created_at' })
    createdAt!: Date;

    @UpdatedAt
    @Column({ field: 'updated_at' })
    updatedAt!: Date;
}

export default CustomerFinancialDetails;
