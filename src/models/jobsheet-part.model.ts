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
import { Part } from './part.model';

@Table({
  tableName: 'job_sheet_parts',
  timestamps: true,
  underscored: true,
})
export class JobSheetPart extends Model {
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

  @Index
  @ForeignKey(() => Part)
  @Column({ type: DataType.UUID, allowNull: false, field: 'part_id' })
  partId!: string;

  @BelongsTo(() => Part)
  part!: Part;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'unit_price' })
  unitPrice!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'total_price' })
  totalPrice!: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, field: 'warranty_months' })
  warrantyMonths!: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default JobSheetPart;

