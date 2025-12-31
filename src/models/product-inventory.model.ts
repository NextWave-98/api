import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  Index,
} from 'sequelize-typescript';
import { Product } from './product.model';
import { Location } from './location.model';
import { ProductStockMovement } from './product-stock-movement.model';

@Table({
  tableName: 'product_inventory',
  timestamps: false, // No updated_at column in database, only created_at
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['product_id', 'location_id'],
    },
  ],
})
export class ProductInventory extends Model {
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
  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, allowNull: false, field: 'location_id' })
  locationId!: string;

  @BelongsTo(() => Location)
  location!: Location;

  @Index
  @Default(0)
  @Column(DataType.INTEGER)
  quantity!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  reservedQuantity!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  availableQuantity!: number;

  @Column(DataType.INTEGER)
  minStockLevel?: number;

  @Column(DataType.INTEGER)
  maxStockLevel?: number;

  @Column({ type: DataType.INTEGER, field: 'reorder_point' })
  reorderPoint?: number;

  @Column(DataType.DATE)
  lastStockCheck?: Date;

  @Column({ type: DataType.DATE, field: 'last_restocked' })
  lastRestocked?: Date;

  @Column({ type: DataType.DATE, field: 'next_stock_check' })
  nextStockCheck?: Date;

  @Column({ type: DataType.STRING, field: 'storage_location' })
  storageLocation?: string;

  @Column({ type: DataType.STRING })
  zone?: string;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10,2), field: 'average_cost' })
  averageCost!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(12,2), field: 'total_value' })
  totalValue!: number;

  // Manually defined - table has `created_at` and `updated_at` columns.
  // Ensure Sequelize does not insert NULL by providing defaults and disallowing nulls.
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at', allowNull: false })
  createdAt!: Date;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'updated_at', allowNull: false })
  updatedAt!: Date;
}

export default ProductInventory;

