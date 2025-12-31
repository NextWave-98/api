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
import { PurchaseOrder } from './purchase-order.model';
import { POStatus } from '../enums';

@Table({
  tableName: 'po_status_history',
  timestamps: false,
  underscored: true,
})
export class POStatusHistory extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => PurchaseOrder)
  @Column({ type: DataType.UUID, allowNull: false, field: 'purchase_order_id' })
  purchaseOrderId!: string;

  @BelongsTo(() => PurchaseOrder)
  purchaseOrder!: PurchaseOrder;

  @Column({ type: DataType.ENUM(...Object.values(POStatus)), field: 'from_status' })
  fromStatus?: POStatus;

  @Column({
    type: DataType.ENUM(...Object.values(POStatus)),
    allowNull: false,
    field: 'to_status',
  })
  toStatus!: POStatus;

  @Index
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'changed_at' })
  changedAt!: Date;

  @Column({ type: DataType.STRING, field: 'changed_by' })
  changedBy?: string;

  @Column(DataType.TEXT)
  remarks?: string;
}

export default POStatusHistory;

