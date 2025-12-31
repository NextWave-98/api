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
import { Warehouse } from './warehouse.model';

@Table({
  tableName: 'warehouse_inventory',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['warehouseId', 'productId'],
    },
  ],
})
export class WarehouseInventory extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => Warehouse)
  @Column({ type: DataType.UUID, allowNull: false })
  warehouseId!: string;

  @BelongsTo(() => Warehouse)
  warehouse!: Warehouse;

  @Index
  @Column({ type: DataType.UUID, allowNull: false })
  productId!: string;

  @Default(0)
  @Column(DataType.INTEGER)
  quantity!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  reservedQuantity!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  availableQuantity!: number;

  @Column(DataType.STRING)
  zoneCode?: string;

  @Column(DataType.STRING)
  aisle?: string;

  @Column(DataType.STRING)
  rack?: string;

  @Column(DataType.STRING)
  shelf?: string;

  @Column(DataType.STRING)
  binLocation?: string;

  @Column(DataType.JSON)
  batches?: any;

  @Column(DataType.DATE)
  lastRestocked?: Date;

  @Column(DataType.DATE)
  lastStockCheck?: Date;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default WarehouseInventory;

