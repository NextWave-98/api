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

@Table({
  tableName: 'branch_staff',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['branch_id', 'user_id'],
    },
  ],
    underscored: true,
})
export class BranchStaff extends Model {
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

export default BranchStaff;

