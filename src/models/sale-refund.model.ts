import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { Sale } from './sale.model';
import { User } from './user.model';
import { PaymentMethod } from '../enums';

@Table({
  tableName: 'sale_refunds',
  timestamps: false,
  underscored: true,
})
export class SaleRefund extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'refund_number' })
  refundNumber!: string;

  @Index
  @ForeignKey(() => Sale)
  @Column({ type: DataType.UUID, allowNull: false, field: 'sale_id' })
  saleId!: string;

  @BelongsTo(() => Sale)
  sale!: Sale;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  amount!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  reason!: string;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: false,
    field: 'refund_method',
  })
  refundMethod!: PaymentMethod;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'refund_date' })
  refundDate!: Date;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, field: 'processed_by_id' })
  processedById!: string;

  @BelongsTo(() => User)
  processedBy!: User;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at' })
  createdAt!: Date;
}

export default SaleRefund;

