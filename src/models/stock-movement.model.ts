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
import { MovementType } from '../enums';

@Table({
  tableName: 'stock_movements',
  timestamps: false,
  underscored: true,
})
export class StockMovement extends Model {
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

  @Column({
    type: DataType.ENUM(...Object.values(MovementType)),
    allowNull: false,
    field: 'movement_type',
  })
  movementType!: MovementType;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity!: number;

  @Column({ type: DataType.STRING, field: 'reference_id' })
  referenceId?: string;

  @Column({ type: DataType.STRING, field: 'reference_type' })
  referenceType?: string;

  @Column(DataType.TEXT)
  notes?: string;

  @Index
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at' })
  createdAt!: Date;
}

export default StockMovement;

