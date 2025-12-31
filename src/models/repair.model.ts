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
import { JobSheet } from './jobsheet.model';
import { RepairStatus } from '../enums';

@Table({
  tableName: 'repairs',
  timestamps: true,
  underscored: true,
})
export class Repair extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => JobSheet)
  @Column({ type: DataType.UUID, allowNull: false, field: 'job_sheet_id' })
  jobSheetId!: string;

  @BelongsTo(() => JobSheet)
  jobSheet!: JobSheet;

  @Column({ type: DataType.STRING, allowNull: false, field: 'repair_type' })
  repairType!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  description!: string;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  cost!: number;

  @Column({ type: DataType.DATE, field: 'start_time' })
  startTime?: Date;

  @Column({ type: DataType.DATE, field: 'end_time' })
  endTime?: Date;

  @Default(RepairStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(RepairStatus)))
  status!: RepairStatus;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default Repair;

