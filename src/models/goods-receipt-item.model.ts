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
import { GoodsReceipt } from './goods-receipt.model';
import { Product } from './product.model';
import { ItemQualityStatus } from '../enums';

@Table({
  tableName: 'goods_receipt_items',
  timestamps: true,
  underscored: true,
})
export class GoodsReceiptItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => GoodsReceipt)
  @Column({ type: DataType.UUID, allowNull: false, field: 'goods_receipt_id' })
  goodsReceiptId!: string;

  @BelongsTo(() => GoodsReceipt)
  goodsReceipt!: GoodsReceipt;

  @Index
  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false, field: 'product_id' })
  productId!: string;

  @BelongsTo(() => Product)
  product!: Product;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'ordered_quantity' })
  orderedQuantity!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'received_quantity' })
  receivedQuantity!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'accepted_quantity' })
  acceptedQuantity!: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, field: 'rejected_quantity' })
  rejectedQuantity!: number;

  @Column({ type: DataType.STRING, field: 'batch_number' })
  batchNumber?: string;

  @Column({ type: DataType.DATE, field: 'expiry_date' })
  expiryDate?: Date;

  @Default(ItemQualityStatus.PENDING)
  @Column({ type: DataType.ENUM(...Object.values(ItemQualityStatus)), field: 'quality_status' })
  qualityStatus!: ItemQualityStatus;

  @Column({ type: DataType.TEXT, field: 'rejection_reason' })
  rejectionReason?: string;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default GoodsReceiptItem;

