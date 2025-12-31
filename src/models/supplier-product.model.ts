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
import { Supplier } from './supplier.model';
import { Product } from './product.model';

@Table({
  tableName: 'supplier_products',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['supplier_id', 'product_id'],
    },
  ],
})
export class SupplierProduct extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => Supplier)
  @Column({ type: DataType.UUID, allowNull: false, field: 'supplier_id' })
  supplierId!: string;

  @BelongsTo(() => Supplier)
  supplier!: Supplier;

  @Index
  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false, field: 'product_id' })
  productId!: string;

  @BelongsTo(() => Product)
  product!: Product;

  @Column({ type: DataType.STRING, field: 'supplier_sku' })
  supplierSKU?: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'supplier_price' })
  supplierPrice!: number;

  @Default(1)
  @Column(DataType.INTEGER)
  moq!: number;

  @Default(7)
  @Column({ type: DataType.INTEGER, field: 'lead_time_days' })
  leadTimeDays!: number;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'is_primary' })
  isPrimary!: boolean;

  @Column({ type: DataType.DATE, field: 'last_purchase_date' })
  lastPurchaseDate?: Date;

  @Column({ type: DataType.DECIMAL(10, 2), field: 'last_purchase_price' })
  lastPurchasePrice?: number;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: 'is_active' })
  isActive!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default SupplierProduct;

