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
import { Warehouse } from './warehouse.model';
import { TransferType, TransferStatus } from '../enums';
import { StockTransferItem } from './stock-transfer-item.model';

@Table({
  tableName: 'stock_transfers',
  timestamps: true,
  underscored: true,
})
export class StockTransfer extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'transfer_number' })
  transferNumber!: string;

  // Source & Destination
  @Index
  @ForeignKey(() => Warehouse)
  @Column({ type: DataType.UUID, field: 'from_warehouse_id' })
  fromWarehouseId?: string;

  @BelongsTo(() => Warehouse, 'fromWarehouseId')
  fromWarehouse?: Warehouse;

  @Index
  @ForeignKey(() => Warehouse)
  @Column({ type: DataType.UUID, field: 'to_warehouse_id' })
  toWarehouseId?: string;

  @BelongsTo(() => Warehouse, 'toWarehouseId')
  toWarehouse?: Warehouse;

  @Column({ type: DataType.UUID, field: 'from_location_id' })
  fromLocationId?: string;

  @Column({ type: DataType.UUID, field: 'to_location_id' })
  toLocationId?: string;

  @Column({
    type: DataType.ENUM(...Object.values(TransferType)),
    allowNull: false,
    field: 'transfer_type',
  })
  transferType!: TransferType;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'transfer_date' })
  transferDate!: Date;

  @Index
  @Default(TransferStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(TransferStatus)))
  status!: TransferStatus;

  @Column({ type: DataType.STRING, field: 'requested_by' })
  requestedBy?: string;

  @Column({ type: DataType.STRING, field: 'approved_by' })
  approvedBy?: string;

  @Column({ type: DataType.DATE, field: 'approved_at' })
  approvedAt?: Date;

  @Column({ type: DataType.STRING, field: 'sent_by' })
  sentBy?: string;

  @Column({ type: DataType.DATE, field: 'sent_at' })
  sentAt?: Date;

  @Column({ type: DataType.STRING, field: 'received_by' })
  receivedBy?: string;

  @Column({ type: DataType.DATE, field: 'received_at' })
  receivedAt?: Date;

  @Column(DataType.TEXT)
  notes?: string;

  @Column(DataType.JSON)
  attachments?: any;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relations
  @HasMany(() => StockTransferItem, { foreignKey: 'stock_transfer_id', as: 'items' })
  items?: StockTransferItem[];
}

export default StockTransfer;

