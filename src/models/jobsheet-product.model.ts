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
import { Product } from './product.model';
import { JobProductStatus } from '../enums';

@Table({
  tableName: 'job_sheet_products',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['product_id', 'status'] },
  ],
})
export class JobSheetProduct extends Model {
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
  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false, field: 'product_id' })
  productId!: string;

  @BelongsTo(() => Product)
  product!: Product;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'unit_price' })
  unitPrice!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'cost_price' })
  costPrice!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'total_price' })
  totalPrice!: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, field: 'warranty_months' })
  warrantyMonths!: number;

  @Column({ type: DataType.STRING, field: 'serial_number' })
  serialNumber?: string;

  @Column({ type: DataType.STRING, field: 'batch_number' })
  batchNumber?: string;

  @Default(JobProductStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(JobProductStatus)))
  status!: JobProductStatus;

  @Column({ type: DataType.DATE, field: 'installed_date' })
  installedDate?: Date;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default JobSheetProduct;

