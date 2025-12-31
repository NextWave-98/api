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
import { Part } from './part.model';
import { Location } from './location.model';

@Table({
  tableName: 'inventories',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['part_id', 'location_id'],
    },
  ],
  underscored: true,
})
export class Inventory extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => Part)
  @Column({ type: DataType.UUID, allowNull: false, field: 'part_id' })
  partId!: string;

  @BelongsTo(() => Part)
  part!: Part;

  @Index
  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, allowNull: false, field: 'location_id' })
  locationId!: string;

  @BelongsTo(() => Location)
  location!: Location;

  @Default(0)
  @Column(DataType.INTEGER)
  quantity!: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'min_level' })
  minLevel?: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'max_level' })
  maxLevel?: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'reorder_point' })
  reorderPoint?: number;

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  updatedAt!: Date;
}

export default Inventory;

