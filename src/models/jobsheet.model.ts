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
  HasOne,
  Index,
} from 'sequelize-typescript';
import { Customer } from './customer.model';
import { Device } from './device.model';
import { Location } from './location.model';
import { User } from './user.model';
import { JobStatus, Priority } from '../enums';
import { Repair } from './repair.model';
import { JobSheetPart } from './jobsheet-part.model';
import { JobSheetProduct } from './jobsheet-product.model';
import { Payment } from './payment.model';
import { JobStatusHistory } from './job-status-history.model';
import { Notification } from './notification.model';
import { WarrantyClaim } from './warranty-claim.model';

@Table({
  tableName: 'job_sheets',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['status', 'location_id'] },
    { fields: ['status', 'created_at'] },
    { fields: ['location_id', 'created_at'] },
  ],
})
export class JobSheet extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'job_number' })
  jobNumber!: string;

  @Index
  @ForeignKey(() => Customer)
  @Column({ type: DataType.UUID, allowNull: false, field: 'customer_id' })
  customerId!: string;

  @BelongsTo(() => Customer)
  customer!: Customer;

  @Index
  @ForeignKey(() => Device)
  @Column({ type: DataType.UUID, allowNull: false, field: 'device_id' })
  deviceId!: string;

  @BelongsTo(() => Device)
  device!: Device;

  @Index
  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, allowNull: false, field: 'location_id' })
  locationId!: string;

  @BelongsTo(() => Location)
  location!: Location;

  @Index
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, field: 'created_by_id' })
  createdById!: string;

  @BelongsTo(() => User, 'createdById')
  createdBy!: User;

  @Index
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'assigned_to_id' })
  assignedToId?: string;

  @BelongsTo(() => User, 'assignedToId')
  assignedTo?: User;

  // Job Details
  @Column({ type: DataType.TEXT, allowNull: false, field: 'issue_description' })
  issueDescription!: string;

  @Column({ type: DataType.TEXT, field: 'customer_remarks' })
  customerRemarks?: string;

  @Column({ type: DataType.TEXT, field: 'technician_remarks' })
  technicianRemarks?: string;

  @Column({ type: DataType.TEXT, field: 'device_condition' })
  deviceCondition?: string;

  @Column(DataType.STRING)
  accessories?: string;

  @Column({ type: DataType.STRING, field: 'device_password' })
  devicePassword?: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'backup_taken' })
  backupTaken!: boolean;

  // Status & Priority
  @Index
  @Default(JobStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(JobStatus)))
  status!: JobStatus;

  @Default(Priority.NORMAL)
  @Column(DataType.ENUM(...Object.values(Priority)))
  priority!: Priority;

  // Dates
  @Index
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'received_date' })
  receivedDate!: Date;

  @Column({ type: DataType.DATE, field: 'expected_date' })
  expectedDate?: Date;

  @Index
  @Column({ type: DataType.DATE, field: 'completed_date' })
  completedDate?: Date;

  @Column({ type: DataType.DATE, field: 'delivered_date' })
  deliveredDate?: Date;

  // Financial
  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2), field: 'estimated_cost' })
  estimatedCost!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2), field: 'actual_cost' })
  actualCost!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2), field: 'labour_cost' })
  labourCost!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2), field: 'parts_cost' })
  partsCost!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2), field: 'discount_amount' })
  discountAmount!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2), field: 'total_amount' })
  totalAmount!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2), field: 'paid_amount' })
  paidAmount!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2), field: 'balance_amount' })
  balanceAmount!: number;

  // Warranty
  @Column({ type: DataType.INTEGER, field: 'warranty_period' })
  warrantyPeriod?: number;

  @Column({ type: DataType.DATE, field: 'warranty_expiry' })
  warrantyExpiry?: Date;

  @CreatedAt
  @Index
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relations
  @HasMany(() => Repair, { foreignKey: 'job_sheet_id', as: 'repairs' })
  repairs?: Repair[];

  @HasMany(() => JobSheetPart, { foreignKey: 'job_sheet_id', as: 'parts' })
  parts?: JobSheetPart[];

  @HasMany(() => JobSheetProduct, { foreignKey: 'job_sheet_id', as: 'products' })
  products?: JobSheetProduct[];

  @HasMany(() => Payment, { foreignKey: 'job_sheet_id', as: 'payments' })
  payments?: Payment[];

  @HasMany(() => JobStatusHistory, { foreignKey: 'job_sheet_id', as: 'statusHistory' })
  statusHistory?: JobStatusHistory[];

  @HasMany(() => Notification, { foreignKey: 'job_sheet_id', as: 'notifications' })
  notifications?: Notification[];

  @HasOne(() => WarrantyClaim, { foreignKey: 'job_sheet_id', as: 'warrantyClaim' })
  warrantyClaim?: WarrantyClaim;
}

export default JobSheet;

