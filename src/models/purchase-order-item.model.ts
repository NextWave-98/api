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
import { Product } from './product.model';

@Table({
  tableName: 'purchase_order_items',
  timestamps: true,
  underscored: true,
})
export class PurchaseOrderItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => PurchaseOrder)
  @Column({ type: DataType.UUID, allowNull: false, field: 'purchase_order_id' })
  purchaseOrderId!: string;

  @BelongsTo(() => PurchaseOrder)
  purchaseOrder!: PurchaseOrder;

  @Index
  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false, field: 'product_id' })
  productId!: string;

  @BelongsTo(() => Product)
  product!: Product;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity!: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, field: 'received_quantity' })
  receivedQuantity!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'unit_price' })
  unitPrice!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(5, 2), field: 'tax_rate' })
  taxRate!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(5, 2), field: 'discount_percent' })
  discountPercent!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, field: 'total_price' })
  totalPrice!: number;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  updatedAt!: Date;
}

export default PurchaseOrderItem;

