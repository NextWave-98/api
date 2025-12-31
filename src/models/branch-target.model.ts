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
import { Branch } from './branch.model';
import { TargetType } from '../enums';

@Table({
  tableName: 'branch_targets',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['branch_id', 'target_type', 'target_period'],
    },
  ],
    underscored: true,
})
export class BranchTarget extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => Branch)
  @Column({ type: DataType.UUID, allowNull: false })
  branchId!: string;

  @BelongsTo(() => Branch)
  branch!: Branch;

  @Column({
    type: DataType.ENUM(...Object.values(TargetType)),
    allowNull: false,
  })
  targetType!: TargetType;

  @Column({ type: DataType.STRING, allowNull: false })
  targetPeriod!: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  targetValue!: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  achievedValue!: number;

  @Column({ type: DataType.DATE, allowNull: false })
  startDate!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  endDate!: Date;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default BranchTarget;

