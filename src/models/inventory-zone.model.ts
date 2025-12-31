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
  tableName: 'inventory_zones',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['warehouse_id', 'zone_code'],
    },
  ],
  underscored: true,
})
export class InventoryZone extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => Warehouse)
  @Column({ type: DataType.UUID, allowNull: false, field: 'warehouse_id' })
  warehouseId!: string;

  @BelongsTo(() => Warehouse)
  warehouse!: Warehouse;

  @Column({ type: DataType.STRING, allowNull: false, field: 'zone_name' })
  zoneName!: string;

  @Column({ type: DataType.STRING, allowNull: false, field: 'zone_code' })
  zoneCode!: string;

  @Column(DataType.TEXT)
  description?: string;

  @Column(DataType.INTEGER)
  capacity?: number;

  @Column({ type: DataType.STRING, field: 'zone_type' })
  zoneType?: string;

  @Column(DataType.JSON)
  aisles?: any;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: 'is_active' })
  isActive!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default InventoryZone;

