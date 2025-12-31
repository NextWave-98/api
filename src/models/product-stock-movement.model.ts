import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { Product } from './product.model';
import { StockMovementType, ReferenceType } from '../enums';

@Table({
  tableName: 'product_stock_movements',
  timestamps: false,
  underscored: true,
})
export class ProductStockMovement extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false, field: 'product_id' })
  productId!: string;

  @BelongsTo(() => Product)
  product!: Product;

  @Index
  @Column({ type: DataType.UUID, field: 'location_id' })
  locationId?: string;

  @Index
  @Column({
    type: DataType.ENUM(
      'PURCHASE',
      'SALES',
      'TRANSFER_IN',
      'TRANSFER_OUT',
      'ADJUSTMENT_IN',
      'ADJUSTMENT_OUT',
      'RETURN_FROM_CUSTOMER',
      'RETURN_TO_SUPPLIER',
      'DAMAGED',
      'EXPIRED',
      'STOLEN',
      'FOUND',
      'USAGE',
      'RESERVATION',
      'RELEASE',
      'WRITE_OFF'
    ),
    allowNull: false,
    field: 'movement_type',
  })
  movementType!: StockMovementType;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity!: number;

  // Before/After quantities
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'quantity_before' })
  quantityBefore!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'quantity_after' })
  quantityAfter!: number;

  // Reference
  @Index
  @Column({ type: DataType.UUID, field: 'reference_id' })
  referenceId?: string;

  @Column({
    type: DataType.ENUM(
      'PURCHASE_ORDER',
      'SALE',
      'JOB_SHEET',
      'TRANSFER',
      'STOCK_TRANSFER',
      'RETURN',
      'ADJUSTMENT',
      'GOODS_RECEIPT',
      'STOCK_RELEASE',
      'SALE_REFUND'
    ),
    field: 'reference_type',
  })
  referenceType?: ReferenceType;

  @Column({ type: DataType.STRING, field: 'reference_number' })
  referenceNumber?: string;

  // Cost tracking
  @Column({ type: DataType.DECIMAL(10, 2), field: 'unit_cost' })
  unitCost?: number;

  @Column({ type: DataType.DECIMAL(12, 2), field: 'total_cost' })
  totalCost?: number;

  // Details
  @Column({ type: DataType.STRING, field: 'batch_number' })
  batchNumber?: string;

  @Column({ type: DataType.STRING, field: 'serial_number' })
  serialNumber?: string;

  @Column({ type: DataType.STRING, field: 'performed_by' })
  performedBy?: string;

  @Column({ type: DataType.STRING, field: 'approved_by' })
  approvedBy?: string;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  @Index
  @Column({ type: DataType.DATE, field: 'created_at' })
  createdAt!: Date;
}

export default ProductStockMovement;

