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
import { StockTransfer } from './stock-transfer.model';

@Table({
  tableName: 'stock_transfer_items',
  timestamps: true,
  underscored: true,
})
export class StockTransferItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => StockTransfer)
  @Column({ type: DataType.UUID, allowNull: false })
  stockTransferId!: string;

  @BelongsTo(() => StockTransfer)
  stockTransfer!: StockTransfer;

  @Index
  @Column({ type: DataType.UUID, allowNull: false })
  productId!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  requestedQuantity!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  sentQuantity!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  receivedQuantity!: number;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default StockTransferItem;

