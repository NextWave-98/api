import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'notification_settings',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['notification_type'],
    },
  ],
})
export class NotificationSetting extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  notificationType!: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  enabled!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  adminEnabled!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  managerEnabled!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  customerEnabled!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  staffEnabled!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  smsEnabled!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  emailEnabled!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  whatsappEnabled!: boolean;

  @Column({
    type: DataType.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
    allowNull: false,
  })
  priority!: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @Default(true)
  @Column(DataType.BOOLEAN)
  autoSend!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default NotificationSetting;

