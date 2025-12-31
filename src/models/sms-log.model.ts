import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  Index,
} from 'sequelize-typescript';
import { SMSTemplateType, SMSStatus } from '../enums';

@Table({
  tableName: 'sms_logs',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['recipient'] },
    { fields: ['reference_id'] },
    { fields: ['sent_at'] },
  ],
})
export class SMSLog extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.ENUM(...Object.values(SMSTemplateType)), allowNull: false })
  type!: SMSTemplateType;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  recipient!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  message!: string;

  @Index
  @Column({ type: DataType.ENUM(...Object.values(SMSStatus)), allowNull: false })
  status!: SMSStatus;

  @Column(DataType.TEXT)
  response?: string;

  @Index
  @Column({ type: DataType.STRING, field: 'reference_id' })
  referenceId?: string;

  @Column({ type: DataType.STRING, field: 'reference_type' })
  referenceType?: string;

  @Index
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'sent_at' })
  sentAt!: Date;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at' })
  createdAt!: Date;
}

export default SMSLog;

