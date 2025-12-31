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
  HasMany,
} from 'sequelize-typescript';
import {
  NotificationType,
  NotificationMethod,
  NotificationStatus,
  RecipientType,
  EventType,
  NotificationPriority,
} from '../enums';
import { Customer } from './customer.model';
import { JobSheet } from './jobsheet.model';
import { Sale } from './sale.model';
import { ProductReturn } from './product-return.model';
import { User } from './user.model';

@Table({
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['recipient_user_id'] },
    { fields: ['type'] },
    { fields: ['status', 'priority'] },
    { fields: ['customer_id'] },
    { fields: ['job_sheet_id'] },
    { fields: ['sale_id'] },
    { fields: ['product_return_id'] },
  ],
  underscored: true,
})
export class Notification extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  // Relations
  @Index
  @ForeignKey(() => Customer)
  @Column(DataType.UUID)
  customerId?: string;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @Index
  @ForeignKey(() => JobSheet)
  @Column(DataType.UUID)
  jobSheetId?: string;

  @BelongsTo(() => JobSheet)
  jobSheet?: JobSheet;

  @Index
  @ForeignKey(() => Sale)
  @Column(DataType.UUID)
  saleId?: string;

  @BelongsTo(() => Sale)
  sale?: Sale;

  @Index
  @ForeignKey(() => ProductReturn)
  @Column(DataType.UUID)
  productReturnId?: string;

  @BelongsTo(() => ProductReturn)
  productReturn?: ProductReturn;

  // Recipient
  @Index
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  recipientUserId?: string;

  @BelongsTo(() => User, 'recipientUserId')
  recipientUser?: User;

  @Column(DataType.STRING)
  recipient!: string; // Phone or Email

  @Column({
    type: DataType.ENUM(...Object.values(RecipientType)),
    defaultValue: RecipientType.CUSTOMER,
  })
  recipientType!: RecipientType;

  @Column(DataType.STRING)
  recipientRole?: string;

  // Content
  @Column({ type: DataType.STRING, allowNull: false })
  title!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  message!: string;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(NotificationType)),
    allowNull: false,
  })
  type!: NotificationType;

  @Column(DataType.ENUM(...Object.values(EventType)))
  eventType?: EventType;

  @Column({
    type: DataType.ENUM(...Object.values(NotificationMethod)),
    allowNull: false,
  })
  method!: NotificationMethod;

  @Default(NotificationPriority.MEDIUM)
  @Column(DataType.ENUM(...Object.values(NotificationPriority)))
  priority!: NotificationPriority;

  // Status & Priority
  @Index
  @Default(NotificationStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(NotificationStatus)))
  status!: NotificationStatus;

  // Workflow
  @Column(DataType.STRING)
  workflowStage?: string;

  @ForeignKey(() => Notification)
  @Column(DataType.UUID)
  parentNotificationId?: string;

  @BelongsTo(() => Notification, 'parentNotificationId')
  parentNotification?: Notification;

  @HasMany(() => Notification, 'parentNotificationId')
  childNotifications?: Notification[];

  // Delivery Metadata
  @Column(DataType.DATE)
  sentAt?: Date;

  @Column(DataType.TEXT)
  failureReason?: string;

  @Column(DataType.DATE)
  lastRetryAt?: Date;

  @Default(0)
  @Column(DataType.INTEGER)
  retryCount!: number;

  @Column(DataType.JSON)
  metadata?: any;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default Notification;
