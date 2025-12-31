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
import { PartCategory } from '../enums';
import { Inventory } from './inventory.model';
import { JobSheetPart } from './jobsheet-part.model';
import { StockMovement } from './stock-movement.model';

@Table({
  tableName: 'parts',
  timestamps: true,
  underscored: true,
})
export class Part extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'part_number' })
  partNumber!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column(DataType.TEXT)
  description?: string;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(PartCategory)),
    allowNull: false,
  })
  category!: PartCategory;

  @Column(DataType.STRING)
  brand?: string;

  @Column(DataType.STRING)
  model?: string;

  @Column(DataType.TEXT)
  compatibility?: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'unit_price' })
  unitPrice!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'cost_price' })
  costPrice!: number;

  @Default(5)
  @Column({ type: DataType.INTEGER, field: 'min_stock_level' })
  minStockLevel!: number;

  @Default(10)
  @Column({ type: DataType.INTEGER, field: 'reorder_level' })
  reorderLevel!: number;

  @Column(DataType.STRING)
  supplier?: string;

  @Column({ type: DataType.STRING, field: 'supplier_contact' })
  supplierContact?: string;

  @Default(0)
  @Column({ type: DataType.INTEGER, field: 'warranty_months' })
  warrantyMonths!: number;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: 'is_active' })
  isActive!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relations
  @HasMany(() => Inventory, { foreignKey: 'part_id', as: 'inventory' })
  inventory?: Inventory[];

  @HasMany(() => JobSheetPart, { foreignKey: 'part_id', as: 'jobSheetParts' })
  jobSheetParts?: JobSheetPart[];

  @HasMany(() => StockMovement, { foreignKey: 'part_id', as: 'stockMovements' })
  stockMovements?: StockMovement[];
}

export default Part;

