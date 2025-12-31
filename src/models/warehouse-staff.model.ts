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
  tableName: 'warehouse_staff',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['warehouseId', 'userId'],
    },
  ],
})
export class WarehouseStaff extends Model {
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
  userId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  position!: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  startDate!: Date;

  @Column(DataType.DATE)
  endDate?: Date;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isPrimary!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default WarehouseStaff;

