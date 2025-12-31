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
import { Location } from './location.model';
import { CustomerType } from '../enums';
import { Device } from './device.model';
import { JobSheet } from './jobsheet.model';
import { Payment } from './payment.model';
import { Notification } from './notification.model';
import { Sale } from './sale.model';
import { WarrantyCard } from './warranty-card.model';
import { ProductReturn } from './product-return.model';

@Table({
  tableName: 'customers',
  timestamps: true,
  underscored: true,
})
export class Customer extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'customer_id' })
  customerId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Index
  @Column(DataType.STRING)
  email?: string;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  phone!: string;

  @Column({ type: DataType.STRING, field: 'alternate_phone' })
  alternatePhone?: string;

  @Column(DataType.STRING)
  address?: string;

  @Column(DataType.STRING)
  city?: string;

  @Column({ type: DataType.STRING, unique: true, field: 'nic_number' })
  nicNumber?: string;

  @Index
  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, field: 'location_id' })
  locationId?: string;

  @BelongsTo(() => Location)
  location?: Location;

  @Default(CustomerType.WALK_IN)
  @Column({ type: DataType.ENUM(...Object.values(CustomerType)), field: 'customer_type' })
  customerType!: CustomerType;

  @Default(0)
  @Column({ type: DataType.INTEGER, field: 'loyalty_points' })
  loyaltyPoints!: number;

  @Column(DataType.TEXT)
  notes?: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: 'is_active' })
  isActive!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relations
  @HasMany(() => Device, { foreignKey: 'customer_id', as: 'devices' })
  devices?: Device[];

  @HasMany(() => JobSheet, { foreignKey: 'customer_id', as: 'jobSheets' })
  jobSheets?: JobSheet[];

  @HasMany(() => Payment, { foreignKey: 'customer_id', as: 'payments' })
  payments?: Payment[];

  @HasMany(() => Notification, { foreignKey: 'customer_id', as: 'notifications' })
  notifications?: Notification[];

  @HasMany(() => Sale, { foreignKey: 'customer_id', as: 'sales' })
  sales?: Sale[];

  @HasMany(() => WarrantyCard, { foreignKey: 'customer_id', as: 'warrantyCards' })
  warrantyCards?: WarrantyCard[];

  @HasMany(() => ProductReturn, { foreignKey: 'customer_id', as: 'productReturns' })
  productReturns?: ProductReturn[];
}

export default Customer;

