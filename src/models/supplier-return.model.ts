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
  HasMany,
  Index,
} from 'sequelize-typescript';
import { Supplier } from './supplier.model';
import { ReturnType, ReturnReason, ReturnStatus, RefundMethod } from '../enums';
import { SupplierReturnItem } from './supplier-return-item.model';

@Table({
  tableName: 'supplier_returns',
  timestamps: true,
  underscored: true,
})
export class SupplierReturn extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  returnNumber!: string;

  @Index
  @ForeignKey(() => Supplier)
  @Column({ type: DataType.UUID, allowNull: false })
  supplierId!: string;

  @BelongsTo(() => Supplier)
  supplier!: Supplier;

  @Column(DataType.UUID)
  purchaseOrderId?: string;

  @Index
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  returnDate!: Date;

  @Column({
    type: DataType.ENUM(...Object.values(ReturnType)),
    allowNull: false,
  })
  returnType!: ReturnType;

  @Column({
    type: DataType.ENUM(...Object.values(ReturnReason)),
    allowNull: false,
  })
  reason!: ReturnReason;

  @Column(DataType.TEXT)
  reasonDescription?: string;

  @Index
  @Default(ReturnStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(ReturnStatus)))
  status!: ReturnStatus;

  // Financial
  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  totalAmount!: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  refundAmount!: number;

  @Column(DataType.ENUM(...Object.values(RefundMethod)))
  refundMethod?: RefundMethod;

  @Column(DataType.DATE)
  refundDate?: Date;

  @Default(false)
  @Column(DataType.BOOLEAN)
  replacementIssued!: boolean;

  // Approval
  @Column(DataType.STRING)
  approvedBy?: string;

  @Column(DataType.DATE)
  approvedAt?: Date;

  @Column(DataType.TEXT)
  notes?: string;

  @Column(DataType.JSON)
  attachments?: any;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relations
  @HasMany(() => SupplierReturnItem, { foreignKey: 'supplier_return_id', as: 'items' })
  items?: SupplierReturnItem[];
}

export default SupplierReturn;

