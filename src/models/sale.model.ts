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
import { Location } from './location.model';
import { User } from './user.model';
import { SaleType, SaleStatus, DiscountType, PaymentStatus, PaymentMethod } from '../enums';
import { SaleItem } from './sale-item.model';
import { SalePayment } from './sale-payment.model';
import { SaleRefund } from './sale-refund.model';
import { WarrantyCard } from './warranty-card.model';
import { Notification } from './notification.model';

@Table({
  tableName: 'sales',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['locationId', 'createdAt'] },
    { fields: ['status', 'locationId'] },
  ],
})
export class Sale extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  saleNumber!: string;

  // Customer (optional for walk-in sales)
  @Index
  @ForeignKey(() => Customer)
  @Column(DataType.UUID)
  customerId?: string;

  @BelongsTo(() => Customer)
  customer?: Customer;

  // Customer information for walk-in sales (without registration)
  @Column({ type: DataType.STRING, field: 'customer_name' })
  customerName?: string;

  @Column({ type: DataType.STRING, field: 'customer_phone' })
  customerPhone?: string;

  @Column({ type: DataType.STRING, field: 'customer_email' })
  customerEmail?: string;

  // Location & Staff
  @Index
  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, allowNull: false, field: 'location_id' })
  locationId!: string;

  @BelongsTo(() => Location)
  location!: Location;

  @Index
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, field: 'sold_by_id' })
  soldById!: string;

  @BelongsTo(() => User, 'soldById')
  soldBy!: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'created_by' })
  createdById?: string;

  @BelongsTo(() => User, 'createdById')
  creator?: User;

  // Sale Type
  @Default(SaleType.DIRECT)
  @Column({ type: DataType.ENUM(...Object.values(SaleType)), field: 'sale_type' })
  saleType!: SaleType;

  @Column({ type: DataType.STRING, field: 'sale_channel' })
  saleChannel?: string;

  // Financial - Detailed breakdown matching Prisma
  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2) })
  subtotal!: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  discount!: number;

  @Column({ type: DataType.ENUM(...Object.values(DiscountType)), field: 'discount_type' })
  discountType?: DiscountType;

  @Column({ type: DataType.STRING, field: 'discount_reason' })
  discountReason?: string;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  tax!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(5, 2), field: 'tax_rate' })
  taxRate!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'total_amount' })
  totalAmount!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2), field: 'paid_amount' })
  paidAmount!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2), field: 'balance_amount' })
  balanceAmount!: number;

  // Payment
  @Default(PaymentStatus.PENDING)
  @Column({ type: DataType.ENUM(...Object.values(PaymentStatus)), field: 'payment_status' })
  paymentStatus!: PaymentStatus;

  @Column({ type: DataType.ENUM(...Object.values(PaymentMethod)), field: 'payment_method' })
  paymentMethod?: PaymentMethod;

  @Column({ type: DataType.STRING, field: 'payment_reference' })
  paymentReference?: string;

  // Status
  @Index
  @Default(SaleStatus.COMPLETED)
  @Column(DataType.ENUM(...Object.values(SaleStatus)))
  status!: SaleStatus;

  // Metadata
  @Column(DataType.TEXT)
  notes?: string;

  @Column({ type: DataType.STRING, field: 'invoice_url' })
  invoiceUrl?: string;

  @Column({ type: DataType.DATE, field: 'completed_at' })
  completedAt?: Date;

  @Column({ type: DataType.DATE, field: 'cancelled_at' })
  cancelledAt?: Date;

  @Index
  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @HasMany(() => SaleItem, { foreignKey: 'sale_id', as: 'saleItems' })
  saleItems?: SaleItem[];

  @HasMany(() => SalePayment, { foreignKey: 'sale_id', as: 'salePayments' })
  salePayments?: SalePayment[];

  @HasMany(() => SaleRefund, { foreignKey: 'sale_id', as: 'saleRefunds' })
  saleRefunds?: SaleRefund[];

  @HasMany(() => WarrantyCard, { foreignKey: 'sale_id', as: 'saleWarrantyCards' })
  saleWarrantyCards?: WarrantyCard[];

  @HasMany(() => Notification, { foreignKey: 'sale_id', as: 'saleNotifications' })
  saleNotifications?: Notification[];
}

export default Sale;

