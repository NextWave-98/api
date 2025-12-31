import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { JobSheet } from './jobsheet.model';
import { JobStatus } from '../enums';

@Table({
  tableName: 'job_status_history',
  timestamps: false,
  underscored: true,
})
export class JobStatusHistory extends Model {
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

  @Column({ type: DataType.ENUM(...Object.values(JobStatus)), field: 'from_status' })
  fromStatus?: JobStatus;

  @Column({
    type: DataType.ENUM(...Object.values(JobStatus)),
    allowNull: false,
    field: 'to_status',
  })
  toStatus!: JobStatus;

  @Index
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'changed_at' })
  changedAt!: Date;

  @Column({ type: DataType.TEXT, field: 'remarks' })
  remarks?: string;
}

export default JobStatusHistory;

