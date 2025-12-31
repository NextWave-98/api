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
import { PurchaseOrder } from './purchase-order.model';
import { Supplier } from './supplier.model';
import { User } from './user.model';
import { PaymentMethod } from '../enums';

@Table({
  tableName: 'supplier_payments',
  timestamps: true,
  underscored: true,
})
export class SupplierPayment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  paymentNumber!: string;

  @Index
  @ForeignKey(() => Supplier)
  @Column({ type: DataType.UUID, allowNull: false })
  supplierId!: string;

  @BelongsTo(() => Supplier)
  supplier!: Supplier;

  @Index
  @ForeignKey(() => PurchaseOrder)
  @Column(DataType.UUID)
  purchaseOrderId?: string;

  @BelongsTo(() => PurchaseOrder)
  purchaseOrder?: PurchaseOrder;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  amount!: number;

  @Index
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, allowNull: false })
  paymentDate!: Date;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: false,
  })
  paymentMethod!: PaymentMethod;

  @Column({ type: DataType.STRING(100), allowNull: true })
  reference?: string;

  @Column({ type: DataType.STRING, field: 'reference_number' })
  referenceNumber?: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  bankName?: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  checkNumber?: string;

  @Column(DataType.UUID)
  transactionId?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  attachments?: any;

  @Column({ type: DataType.STRING(100), allowNull: true })
  paidBy?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  createdBy!: string;

  @BelongsTo(() => User)
  creator!: User;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default SupplierPayment;

