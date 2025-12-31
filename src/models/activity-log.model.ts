import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  Index,
} from 'sequelize-typescript';

@Table({
  tableName: 'activity_logs',
  timestamps: true,
  indexes: [
    { fields: ['user_id', 'created_at'] },
    { fields: ['module'] },
  ],
  underscored: true,
})
export class ActivityLog extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column(DataType.UUID)
  userId?: string;

  @Column(DataType.STRING)
  userName?: string;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  action!: string;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  module!: string;

  @Index
  @Column(DataType.STRING)
  recordId?: string;

  @Column(DataType.JSON)
  details?: any;

  @Column(DataType.STRING)
  ipAddress?: string;

  @Column(DataType.STRING)
  userAgent?: string;



  @Index
  @CreatedAt
  createdAt!: Date;
}

export default ActivityLog;

