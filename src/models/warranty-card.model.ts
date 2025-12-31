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
import { SaleItem } from './sale-item.model';
import { Product } from './product.model';
import { Customer } from './customer.model';
import { Location } from './location.model';
import { WarrantyType, WarrantyStatus } from '../enums';
import { WarrantyClaim } from './warranty-claim.model';

@Table({
  tableName: 'warranty_cards',
  timestamps: true,
  underscored: true,
})
export class WarrantyCard extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'warranty_number' })
  warrantyNumber!: string;

  // Sale Link
  @Index
  @ForeignKey(() => Sale)
  @Column({ type: DataType.UUID, allowNull: false, field: 'sale_id' })
  saleId!: string;

  @BelongsTo(() => Sale)
  sale!: Sale;

  @Index
  @ForeignKey(() => SaleItem)
  @Column({ type: DataType.UUID, unique: true, allowNull: false, field: 'sale_item_id' })
  saleItemId!: string;

  @BelongsTo(() => SaleItem)
  saleItem!: SaleItem;

  // Product Information
  @Index
  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false, field: 'product_id' })
  productId!: string;

  @BelongsTo(() => Product)
  product!: Product;

  @Column({ type: DataType.STRING, allowNull: false, field: 'product_name' })
  productName!: string;

  @Column({ type: DataType.STRING, field: 'product_sku' })
  productSku?: string;

  @Column({ type: DataType.STRING, allowNull: false, field: 'product_code' })
  productCode!: string;

  @Column({ type: DataType.STRING, field: 'serial_number' })
  serialNumber?: string;

  // Customer Information
  @Index
  @ForeignKey(() => Customer)
  @Column({ type: DataType.UUID, field: 'customer_id' })
  customerId?: string;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @Column({ type: DataType.STRING, allowNull: false, field: 'customer_name' })
  customerName!: string;

  @Index
  @Column({ type: DataType.STRING, allowNull: false, field: 'customer_phone' })
  customerPhone!: string;

  @Column({ type: DataType.STRING, field: 'customer_email' })
  customerEmail?: string;

  // Location
  @Index
  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, allowNull: false, field: 'location_id' })
  locationId!: string;

  @BelongsTo(() => Location)
  location!: Location;

  // Warranty Details
  @Column({
    type: DataType.ENUM(...Object.values(WarrantyType)),
    allowNull: false,
    field: 'warranty_type',
  })
  warrantyType!: WarrantyType;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'warranty_months' })
  warrantyMonths!: number;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'start_date' })
  startDate!: Date;

  @Index
  @Column({ type: DataType.DATE, allowNull: false, field: 'expiry_date' })
  expiryDate!: Date;

  // Terms & Conditions
  @Column({ type: DataType.TEXT, field: 'terms' })
  terms?: string;

  @Column({ type: DataType.TEXT, field: 'coverage' })
  coverage?: string;

  @Column({ type: DataType.TEXT, field: 'exclusions' })
  exclusions?: string;

  // Status
  @Index
  @Default(WarrantyStatus.ACTIVE)
  @Column({ type: DataType.ENUM(...Object.values(WarrantyStatus)), field: 'status' })
  status!: WarrantyStatus;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'activated_at' })
  activatedAt!: Date;

  @Column({ type: DataType.DATE, field: 'voided_at' })
  voidedAt?: Date;

  @Column({ type: DataType.TEXT, field: 'void_reason' })
  voidReason?: string;

  // Transfer
  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'is_transferred' })
  isTransferred!: boolean;

  @Column({ type: DataType.STRING, field: 'transferred_to' })
  transferredTo?: string;

  @Column({ type: DataType.STRING, field: 'transferred_phone' })
  transferredPhone?: string;

  @Column({ type: DataType.DATE, field: 'transferred_date' })
  transferredDate?: Date;

  @Column({ type: DataType.TEXT, field: 'transfer_notes' })
  transferNotes?: string;

  // Metadata
  @Column({ type: DataType.TEXT, field: 'notes' })
  notes?: string;

  @Column({ type: DataType.JSON, field: 'attachments' })
  attachments?: any;

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @HasMany(() => WarrantyClaim, { foreignKey: 'warranty_card_id', as: 'claims' })
  claims?: WarrantyClaim[];
}

export default WarrantyCard;

