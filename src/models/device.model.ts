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
import { Customer } from './customer.model';
import { DeviceType } from '../enums';
import { JobSheet } from './jobsheet.model';

@Table({
  tableName: 'devices',
  timestamps: true,
  underscored: true,
})
export class Device extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => Customer)
  @Column({ type: DataType.UUID, allowNull: false, field: 'customer_id' })
  customerId!: string;

  @BelongsTo(() => Customer)
  customer!: Customer;

  @Column({
    type: DataType.ENUM(...Object.values(DeviceType)),
    allowNull: false,
    field: 'device_type',
  })
  deviceType!: DeviceType;

  @Column({ type: DataType.STRING, allowNull: false })
  brand!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  model!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, field: 'serial_number' })
  serialNumber?: string;

  @Index
  @Column({ type: DataType.STRING, unique: true })
  imei?: string;

  @Column(DataType.STRING)
  color?: string;

  @Column({ type: DataType.DATE, field: 'purchase_date' })
  purchaseDate?: Date;

  @Column({ type: DataType.DATE, field: 'warranty_expiry' })
  warrantyExpiry?: Date;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relations
  @HasMany(() => JobSheet, { foreignKey: 'device_id', as: 'jobSheets' })
  jobSheets?: JobSheet[];
}

export default Device;

