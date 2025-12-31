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
import { Supplier } from './supplier.model';
import { Location } from './location.model';
import { POStatus, POPaymentStatus, Priority } from '../enums';
import { PurchaseOrderItem } from './purchase-order-item.model';
import { GoodsReceipt } from './goods-receipt.model';
import { SupplierPayment } from './supplier-payment.model';
import { POStatusHistory } from './po-status-history.model';

@Table({
  tableName: 'purchase_orders',
  timestamps: true,
  underscored: true,
})
export class PurchaseOrder extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  poNumber!: string;

  @Index
  @ForeignKey(() => Supplier)
  @Column({ type: DataType.UUID, allowNull: false })
  supplierId!: string;

  @BelongsTo(() => Supplier)
  supplier!: Supplier;

  // Order Details
  @Index
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  orderDate!: Date;

  @Column(DataType.DATE)
  expectedDate?: Date;

  @Column(DataType.DATE)
  receivedDate?: Date;

  // Status
  @Index
  @Default(POStatus.DRAFT)
  @Column(DataType.ENUM(...Object.values(POStatus)))
  status!: POStatus;

  @Default(Priority.NORMAL)
  @Column(DataType.ENUM(...Object.values(Priority)))
  priority!: Priority;

  @Default(POPaymentStatus.UNPAID)
  @Column(DataType.ENUM(...Object.values(POPaymentStatus)))
  paymentStatus!: POPaymentStatus;

  // Financial
  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  subtotal!: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  taxAmount!: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  shippingCost!: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  discountAmount!: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  totalAmount!: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  paidAmount!: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  balanceAmount!: number;

  // Additional Info
  @Column(DataType.STRING)
  paymentTerms?: string;

  @Column(DataType.STRING)
  shippingMethod?: string;

  @Column(DataType.TEXT)
  shippingAddress?: string;

  @Column(DataType.TEXT)
  notes?: string;

  @Column(DataType.TEXT)
  internalNotes?: string;

  @Column(DataType.JSON)
  attachments?: any;

  // Approval
  @Column(DataType.STRING)
  approvedBy?: string;

  @Column(DataType.DATE)
  approvedAt?: Date;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relations
  @HasMany(() => PurchaseOrderItem, { foreignKey: 'purchase_order_id', as: 'items' })
  items?: PurchaseOrderItem[];

  @HasMany(() => GoodsReceipt, { foreignKey: 'purchase_order_id', as: 'receipts' })
  receipts?: GoodsReceipt[];

  @HasMany(() => SupplierPayment, { foreignKey: 'purchase_order_id', as: 'payments' })
  payments?: SupplierPayment[];

  @HasMany(() => POStatusHistory, { foreignKey: 'purchase_order_id', as: 'statusHistory' })
  statusHistory?: POStatusHistory[];
}

export default PurchaseOrder;

