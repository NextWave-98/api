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
import { User } from './user.model';

@Table({
  tableName: 'staff',
  timestamps: true,
  underscored: true,
})
export class Staff extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'staff_id' })
  staffId!: string;

  @Index
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, unique: true, allowNull: false, field: 'user_id' })
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'nic_number' })
  nicNumber!: string;

  @Column({ type: DataType.DATE, field: 'date_of_birth' })
  dateOfBirth?: Date;

  @Column(DataType.STRING)
  address?: string;

  @Column({ type: DataType.STRING, unique: true, field: 'phone_number' })
  phoneNumber?: string;

  @Column({ type: DataType.STRING, field: 'additional_phone' })
  additionalPhone?: string;

  @Column({ type: DataType.STRING, field: 'emergency_contact' })
  emergencyContact?: string;

  @Column({ type: DataType.STRING, field: 'emergency_name' })
  emergencyName?: string;

  @Column({ type: DataType.STRING, field: 'emergency_relation' })
  emergencyRelation?: string;

  @Column(DataType.TEXT)
  qualifications?: string;

  @Column(DataType.TEXT)
  experience?: string;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'joining_date' })
  joiningDate!: Date;

  @Column({ type: DataType.STRING, field: 'profile_image' })
  profileImage?: string;

  @Column({ type: DataType.STRING, field: 'cloudinary_public_id' })
  cloudinaryPublicId?: string;

  @Column(DataType.JSON)
  documents?: any;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

export default Staff;

