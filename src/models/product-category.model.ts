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
import { Product } from './product.model';

@Table({
  tableName: 'product_categories',
  timestamps: true,
  underscored: true,
})
export class ProductCategory extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'category_code' })
  categoryCode!: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  name!: string;

  @Column(DataType.TEXT)
  description?: string;

  // Self-referential for hierarchy
  @Index
  @ForeignKey(() => ProductCategory)
  @Column({ type: DataType.UUID, field: 'parent_id' })
  parentId?: string;

  @BelongsTo(() => ProductCategory, 'parentId')
  parent?: ProductCategory;

  @HasMany(() => ProductCategory, 'parentId')
  children?: ProductCategory[];

  @Column(DataType.STRING)
  image?: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: 'is_active' })
  isActive!: boolean;

  @Default(0)
  @Column({ type: DataType.INTEGER, field: 'display_order' })
  displayOrder!: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relations
  @HasMany(() => Product, { foreignKey: 'category_id', as: 'products' })
  products?: Product[];
}

export default ProductCategory;

