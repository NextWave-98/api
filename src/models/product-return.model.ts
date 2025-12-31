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
import { Sale } from './sale.model';
import { Customer } from './customer.model';
import { Location } from './location.model';
import { Product } from './product.model';
import { User } from './user.model';
import { Notification } from './notification.model';
import {
  ReturnSourceType,
  ReturnCategory,
  ReturnStatus,
  ProductCondition,
  Priority,
  ResolutionType,
} from '../enums';

@Table({
  tableName: 'product_returns',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['return_number'] },
    { fields: ['location_id'] },
    { fields: ['product_id'] },
    { fields: ['customer_id'] },
    { fields: ['status'] },
    { fields: ['return_category'] },
    { fields: ['source_type', 'source_id'] },
    { fields: ['created_at'] },
    { fields: ['location_id', 'status'] },
    { fields: ['location_id', 'created_at'] },
  ],
})
export class ProductReturn extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'return_number' })
  returnNumber!: string;

  @Index
  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, allowNull: false, field: 'location_id' })
  locationId!: string;

  @BelongsTo(() => Location)
  location!: Location;

  @Column({
    type: DataType.ENUM(...Object.values(ReturnSourceType)),
    allowNull: false,
    field: 'source_type',
  })
  sourceType!: ReturnSourceType;

  @Column({ type: DataType.UUID, field: 'source_id' })
  sourceId?: string;

  @Index
  @ForeignKey(() => Customer)
  @Column({ type: DataType.UUID, field: 'customer_id' })
  customerId?: string;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @Column({ type: DataType.STRING, field: 'customer_name' })
  customerName?: string;

  @Column({ type: DataType.STRING, field: 'customer_phone' })
  customerPhone?: string;

  @Index
  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false, field: 'product_id' })
  productId!: string;

  @BelongsTo(() => Product)
  product!: Product;

  @Default(1)
  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity!: number;

  @Column({ type: DataType.STRING, field: 'serial_number' })
  serialNumber?: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'return_reason' })
  returnReason!: string;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(ReturnCategory)),
    allowNull: false,
    field: 'return_category',
  })
  returnCategory!: ReturnCategory;

  @Column({
    type: DataType.ENUM(...Object.values(ProductCondition)),
    allowNull: false,
    field: 'condition',
  })
  condition!: ProductCondition;

  @Column({ type: DataType.TEXT, field: 'condition_notes' })
  conditionNotes?: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'product_value' })
  productValue!: number;

  @Column({ type: DataType.DECIMAL(10, 2), field: 'refund_amount' })
  refundAmount?: number;

  @Index
  @Default('RECEIVED')
  @Column({ type: DataType.ENUM(...Object.values(ReturnStatus)), allowNull: false })
  status!: ReturnStatus;

  @Default('NORMAL')
  @Column({ type: DataType.ENUM(...Object.values(Priority)), allowNull: false })
  priority!: Priority;

  @Column({ type: DataType.UUID, field: 'inspected_by' })
  inspectedBy?: string;

  @Column({ type: DataType.DATE, field: 'inspected_at' })
  inspectedAt?: Date;

  @Column({ type: DataType.TEXT, field: 'inspection_notes' })
  inspectionNotes?: string;

  @Column({ type: DataType.UUID, field: 'approved_by' })
  approvedBy?: string;

  @Column({ type: DataType.DATE, field: 'approved_at' })
  approvedAt?: Date;

  @Column({ type: DataType.TEXT, field: 'approval_notes' })
  approvalNotes?: string;

  @Column({
    type: DataType.ENUM(...Object.values(ResolutionType)),
    field: 'resolution_type',
  })
  resolutionType?: ResolutionType;

  @Column({ type: DataType.TEXT, field: 'resolution_details' })
  resolutionDetails?: string;

  @Column({ type: DataType.DATE, field: 'resolution_date' })
  resolutionDate?: Date;

  @Column({ type: DataType.UUID, field: 'sale_refund_id' })
  saleRefundId?: string;

  @Column({ type: DataType.UUID, field: 'supplier_return_id' })
  supplierReturnId?: string;

  @Column({ type: DataType.UUID, field: 'stock_transfer_id' })
  stockTransferId?: string;

  @Column({ type: DataType.JSONB, field: 'images' })
  images?: any;

  @Column({ type: DataType.JSONB, field: 'documents' })
  documents?: any;

  @Column(DataType.TEXT)
  notes?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, field: 'created_by_id' })
  createdById!: string;

  @BelongsTo(() => User, 'createdById')
  createdBy?: User;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @Column({ type: DataType.DATE, field: 'completed_at' })
  completedAt?: Date;

  @HasMany(() => Notification)
  notifications!: Notification[];
}

export default ProductReturn;

