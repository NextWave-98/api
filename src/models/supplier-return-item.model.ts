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
import { SupplierReturn } from './supplier-return.model';

@Table({
  tableName: 'supplier_return_items',
  timestamps: true,
  underscored: true,
})
export class SupplierReturnItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => SupplierReturn)
  @Column({ type: DataType.UUID, allowNull: false })
  supplierReturnId!: string;

  @BelongsTo(() => SupplierReturn)
  supplierReturn!: SupplierReturn;

  @Index
  @Column({ type: DataType.UUID, allowNull: false })
  productId!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  unitPrice!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  totalPrice!: number;

  @Column(DataType.STRING)
  batchNumber?: string;

  @Column(DataType.STRING)
  serialNumber?: string;

  @Column(DataType.STRING)
  condition?: string;

  @Column(DataType.JSON)
  images?: any;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default SupplierReturnItem;

