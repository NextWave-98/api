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
import { Product } from './product.model';
import { Location } from './location.model';
import { User } from './user.model';

export enum AddonRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

@Table({
  tableName: 'addon_requests',
  timestamps: true,
  indexes: [
    { fields: ['product_id'] },
    { fields: ['location_id'] },
    { fields: ['requested_by'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
  ],
  underscored: true,
})
export class AddonRequest extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => Product)
  @Column(DataType.UUID)
  productId!: string;

  @BelongsTo(() => Product)
  product?: Product;

  @Index
  @ForeignKey(() => Location)
  @Column(DataType.UUID)
  locationId!: string;

  @BelongsTo(() => Location)
  location?: Location;

  @Index
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  requestedBy!: string;

  @BelongsTo(() => User, 'requestedBy')
  requestedByUser?: User;

  @Column(DataType.INTEGER)
  currentQuantity!: number;

  @Column(DataType.INTEGER)
  requestedQuantity!: number;

  @Column(DataType.TEXT)
  remark?: string;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(AddonRequestStatus)),
    defaultValue: AddonRequestStatus.PENDING,
  })
  status!: AddonRequestStatus;

  @Column(DataType.BOOLEAN)
  smsNotificationSent!: boolean;

  @Column(DataType.BOOLEAN)
  smsDelivered!: boolean;

  @Column(DataType.TEXT)
  smsResponse?: string;

  @Column(DataType.STRING)
  smsMessageId?: string;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;
}
