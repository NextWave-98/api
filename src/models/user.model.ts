import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  ForeignKey,
  BelongsTo,
  HasOne,
  HasMany,
  Index,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Role } from './role.model';
import { Location } from './location.model';
import { Staff } from './staff.model';
import { JobSheet } from './jobsheet.model';
import { Payment } from './payment.model';
import { ActivityLog } from './activity-log.model';
import { Sale } from './sale.model';
import { SalePayment } from './sale-payment.model';
import { SaleRefund } from './sale-refund.model';
import { WarrantyClaim } from './warranty-claim.model';
import { ProductReturn } from './product-return.model';
import { Notification } from './notification.model';

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['roleId'] },
    { fields: ['locationId'] },
  ],
})
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Unique
  @AllowNull(false)
  @Index
  @Column(DataType.STRING)
  email!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password!: string;

  @ForeignKey(() => Role)
  @AllowNull(false)
  @Index
  @Column({ type: DataType.UUID, field: 'role_id' })
  roleId!: string;

  @AllowNull(true)
  @Index
  @Column({ type: DataType.UUID, field: 'location_id' })
  locationId?: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: 'is_active' })
  isActive!: boolean;

  @AllowNull(true)
  @Column({ type: DataType.TEXT, field: 'refresh_token' })
  refreshToken?: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  lastLogin?: Date;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  // Relationships
  @BelongsTo(() => Role, { foreignKey: 'role_id', as: 'role' })
  role?: Role;

  @BelongsTo(() => Location, { foreignKey: 'location_id', as: 'location' })
  location?: Location;

  @HasOne(() => Staff, { foreignKey: 'user_id', as: 'staff' })
  staff?: Staff;

  // Job Sheet Relations
  @HasMany(() => JobSheet, { foreignKey: 'created_by_id', as: 'createdJobSheets' })
  createdJobSheets?: JobSheet[];

  @HasMany(() => JobSheet, { foreignKey: 'assigned_to_id', as: 'assignedJobSheets' })
  assignedJobSheets?: JobSheet[];

  // Payment Relations
  @HasMany(() => Payment, { foreignKey: 'received_by_id', as: 'receivedPayments' })
  receivedPayments?: Payment[];

  // Activity Log Relations
  @HasMany(() => ActivityLog, { foreignKey: 'user_id', as: 'activityLogs' })
  activityLogs?: ActivityLog[];

  // Sales Relations
  @HasMany(() => Sale, { foreignKey: 'sold_by_id', as: 'soldSales' })
  soldSales?: Sale[];

  @HasMany(() => Sale, { foreignKey: 'created_by', as: 'createdSales' })
  createdSales?: Sale[];

  @HasMany(() => SalePayment, { foreignKey: 'received_by_id', as: 'receivedSalePayments' })
  receivedSalePayments?: SalePayment[];

  @HasMany(() => SaleRefund, { foreignKey: 'processed_by_id', as: 'processedSaleRefunds' })
  processedSaleRefunds?: SaleRefund[];

  // Warranty Relations
  @HasMany(() => WarrantyClaim, { foreignKey: 'submitted_by_id', as: 'submittedClaims' })
  submittedClaims?: WarrantyClaim[];

  @HasMany(() => WarrantyClaim, { foreignKey: 'assigned_to_id', as: 'assignedClaims' })
  assignedClaims?: WarrantyClaim[];

  // Product Return Relations
  @HasMany(() => ProductReturn, { foreignKey: 'created_by_id', as: 'createdReturns' })
  createdReturns?: ProductReturn[];

  // Notification Relations
  @HasMany(() => Notification, { foreignKey: 'recipient_user_id', as: 'notifications' })
  notifications?: Notification[];
}

export default User;

