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
import { PurchaseOrder } from './purchase-order.model';
import { Location } from './location.model';
import { User } from './user.model';
import { GRNStatus } from '../enums';
import { GoodsReceiptItem } from './goods-receipt-item.model';

@Table({
  tableName: 'goods_receipts',
  timestamps: true,
  underscored: true,
})
export class GoodsReceipt extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  receiptNumber!: string;

  @Index
  @ForeignKey(() => PurchaseOrder)
  @Column({ type: DataType.UUID, allowNull: false })
  purchaseOrderId!: string;

  @BelongsTo(() => PurchaseOrder)
  purchaseOrder!: PurchaseOrder;

  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, allowNull: false })
  destinationLocationId!: string;

  @BelongsTo(() => Location)
  destinationLocation!: Location;

  @Index
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  receiptDate!: Date;

  @Column({ type: DataType.UUID, field: 'received_by' })
  receivedBy?: string;

  @BelongsTo(() => User, { foreignKey: 'received_by', as: 'receivedByUser' })
  receivedByUser?: User;

  @Column(DataType.STRING)
  invoiceNumber?: string;

  @Column(DataType.DATE)
  invoiceDate?: Date;

  @Column(DataType.TEXT)
  notes?: string;

  @Column(DataType.JSON)
  attachments?: any;

  @Default(GRNStatus.PENDING_QC)
  @Column(DataType.ENUM(...Object.values(GRNStatus)))
  status!: GRNStatus;

  @Column({ type: DataType.UUID, field: 'quality_check_by' })
  qualityCheckBy?: string;

  @BelongsTo(() => User, { foreignKey: 'quality_check_by', as: 'qualityCheckByUser' })
  qualityCheckByUser?: User;

  @Column(DataType.DATE)
  qualityCheckDate?: Date;

  @Column(DataType.TEXT)
  qualityCheckNotes?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relations
  @HasMany(() => GoodsReceiptItem, { foreignKey: 'goods_receipt_id', as: 'items' })
  items?: GoodsReceiptItem[];
}

export default GoodsReceipt;

