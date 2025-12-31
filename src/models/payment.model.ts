import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
  ForeignKey,
  Index,
} from 'sequelize-typescript';
import { JobSheet } from './jobsheet.model';
import { Customer } from './customer.model';
import { User } from './user.model';
import { PaymentMethod } from '../enums';

@Table({
  tableName: 'payments',
  timestamps: true,
  indexes: [
    { fields: ['payment_date', 'payment_method'] },
  ],
})
export class Payment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'payment_number' })
  paymentNumber!: string;

  @ForeignKey(() => JobSheet)
  @Index
  @Column({ type: DataType.UUID, allowNull: true, field: 'job_sheet_id' })
  jobSheetId?: string;

  @BelongsTo(() => JobSheet)
  jobSheet?: JobSheet;

  @ForeignKey(() => Customer)
  @Index
  @Column({ type: DataType.UUID, allowNull: true, field: 'customer_id' })
  customerId?: string;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @ForeignKey(() => User)
  @Index
  @Column({ type: DataType.UUID, allowNull: true, field: 'received_by_id' })
  receivedBy?: string;

  @BelongsTo(() => User)
  receivedByUser?: User;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  amount!: number;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: false,
    field: 'payment_method',
  })
  paymentMethod!: PaymentMethod;

  @Index
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'payment_date' })
  paymentDate!: Date;

  @Column({ type: DataType.STRING, field: 'reference' })
  referenceNumber?: string;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  updatedAt!: Date;
}

export default Payment;

