import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  HasMany,
  Index,
} from 'sequelize-typescript';
import { SupplierType, SupplierStatus } from '../enums';
import { SupplierProduct } from './supplier-product.model';
import { PurchaseOrder } from './purchase-order.model';
import { SupplierReturn } from './supplier-return.model';
import { SupplierPayment } from './supplier-payment.model';

@Table({
  tableName: 'suppliers',
  timestamps: true,
  underscored: true,
})
export class Supplier extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  supplierCode!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column(DataType.STRING)
  companyName?: string;

  @Index
  @Column({ type: DataType.STRING, unique: true })
  email?: string;

  @Column({ type: DataType.STRING, allowNull: false })
  phone!: string;

  @Column(DataType.STRING)
  alternatePhone?: string;

  @Column(DataType.STRING)
  fax?: string;

  @Column(DataType.STRING)
  website?: string;

  // Address
  @Column(DataType.TEXT)
  address?: string;

  @Column(DataType.STRING)
  city?: string;

  @Column(DataType.STRING)
  state?: string;

  @Column(DataType.STRING)
  postalCode?: string;

  @Default('Sri Lanka')
  @Column(DataType.STRING)
  country!: string;

  // Business Details
  @Column({ type: DataType.STRING, unique: true })
  taxId?: string;

  @Column({ type: DataType.STRING, unique: true })
  registrationNumber?: string;

  @Column(DataType.STRING)
  paymentTerms?: string;

  @Column(DataType.DECIMAL(12, 2))
  creditLimit?: number;

  @Default(30)
  @Column(DataType.INTEGER)
  creditDays!: number;

  // Banking Details
  @Column(DataType.STRING)
  bankName?: string;

  @Column(DataType.STRING)
  accountNumber?: string;

  @Column(DataType.STRING)
  accountName?: string;

  @Column(DataType.STRING)
  swiftCode?: string;

  // Contact Person
  @Column(DataType.STRING)
  contactPersonName?: string;

  @Column(DataType.STRING)
  contactPersonPhone?: string;

  @Column(DataType.STRING)
  contactPersonEmail?: string;

  @Column(DataType.STRING)
  contactPersonDesignation?: string;

  // Rating & Status
  @Column(DataType.DECIMAL(3, 2))
  rating?: number;

  @Default(SupplierType.LOCAL)
  @Column(DataType.ENUM(...Object.values(SupplierType)))
  supplierType!: SupplierType;

  @Index
  @Default(SupplierStatus.ACTIVE)
  @Column(DataType.ENUM(...Object.values(SupplierStatus)))
  status!: SupplierStatus;

  // Documents
  @Column(DataType.JSON)
  documents?: any;

  @Column(DataType.TEXT)
  notes?: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relations
  @HasMany(() => SupplierProduct, { foreignKey: 'supplier_id', as: 'supplierProducts' })
  supplierProducts?: SupplierProduct[];

  @HasMany(() => PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchaseOrders' })
  purchaseOrders?: PurchaseOrder[];

  @HasMany(() => SupplierReturn, { foreignKey: 'supplier_id', as: 'supplierReturns' })
  supplierReturns?: SupplierReturn[];

  @HasMany(() => SupplierPayment, { foreignKey: 'supplier_id', as: 'supplierPayments' })
  supplierPayments?: SupplierPayment[];
}

export default Supplier;

