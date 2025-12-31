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
import { StockRelease } from './stock-release.model';
import { Product } from './product.model';

@Table({
  tableName: 'stock_release_items',
  timestamps: true,
  underscored: true,
})
export class StockReleaseItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => StockRelease)
  @Column({ type: DataType.UUID, allowNull: false })
  stockReleaseId!: string;

  @BelongsTo(() => StockRelease)
  stockRelease!: StockRelease;

  @Index
  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false })
  productId!: string;

  @BelongsTo(() => Product)
  product!: Product;

  @Column({ type: DataType.INTEGER, allowNull: false })
  requestedQuantity!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  releasedQuantity!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  unitCost!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  totalCost!: number;

  @Column(DataType.STRING)
  batchNumber?: string;

  @Column(DataType.STRING)
  serialNumber?: string;

  @Column(DataType.STRING)
  location?: string;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default StockReleaseItem;

