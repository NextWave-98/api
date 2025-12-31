import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { Sale } from './sale.model';
import { User } from './user.model';
import { PaymentMethod, PaymentStatus } from '../enums';

@Table({
  tableName: 'sale_payments',
  timestamps: false,
  underscored: false,
})
export class SalePayment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'payment_number' })
  paymentNumber!: string;

  @Index
  @Column({ type: DataType.UUID, allowNull: false, field: 'sale_id' })
  saleId!: string;

  @BelongsTo(() => Sale, { foreignKey: 'sale_id', as: 'sale' })
  sale!: Sale;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  amount!: number;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: false,
    field: 'payment_method',
  })
  paymentMethod!: PaymentMethod;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'payment_date' })
  paymentDate!: Date;

  @Column({ type: DataType.STRING, field: 'reference_number' })
  referenceNumber?: string;

  @Column(DataType.STRING)
  notes?: string;

  @Default(PaymentStatus.COMPLETED)
  @Column({
    type: DataType.ENUM(...Object.values(PaymentStatus)),
    allowNull: false,
  })
  status!: PaymentStatus;

  @Column({ type: DataType.UUID, allowNull: false, field: 'received_by_id' })
  receivedById!: string;

  @BelongsTo(() => User, { foreignKey: 'received_by_id', as: 'receivedBy' })
  receivedBy!: User;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at' })
  createdAt!: Date;
}


export default SalePayment;

