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
  HasOne,
  Index,
} from 'sequelize-typescript';
import { Sale } from './sale.model';
import { Product } from './product.model';
import { WarrantyCard } from './warranty-card.model';

@Table({
  tableName: 'sale_items',
  timestamps: true,
  underscored: true,
})
export class SaleItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => Sale)
  @Column({ type: DataType.UUID, allowNull: false, field: 'sale_id' })
  saleId!: string;

  @BelongsTo(() => Sale)
  sale!: Sale;

  @Index
  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false, field: 'product_id' })
  productId!: string;

  @BelongsTo(() => Product)
  product!: Product;

  @Column({ type: DataType.STRING, allowNull: false, field: 'product_name' })
  productName!: string;
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'cost_price' })
  costPrice!: number;
  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'unit_price' })
  unitPrice!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2), field: 'discount' })
  discountAmount!: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  tax!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  subtotal!: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, field: 'warranty_months' })
  warrantyMonths!: number;

  @Column({ type: DataType.DATE, field: 'warranty_expiry' })
  warrantyExpiry?: Date;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  createdAt!: Date;

  // Relations
  @HasOne(() => WarrantyCard, { foreignKey: 'sale_item_id', as: 'warrantyCard' })
  warrantyCard?: WarrantyCard;
}

export default SaleItem;

