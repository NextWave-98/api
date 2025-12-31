import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  HasMany,
  HasOne,
  Index,
} from 'sequelize-typescript';
import { BranchType } from '../enums';
import { Location } from './location.model';
import { BranchStaff } from './branch-staff.model';
import { BranchTarget } from './branch-target.model';

@Table({
  tableName: 'branches',
  timestamps: true,
  underscored: true,
})
export class Branch extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'branch_code' })
  branchCode!: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING, field: 'short_name' })
  shortName?: string;

  @Column(DataType.TEXT)
  description?: string;

  // Address Details
  @Column({ type: DataType.STRING, allowNull: false })
  address!: string;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  city!: string;

  @Column(DataType.STRING)
  district?: string;

  @Column(DataType.STRING)
  province?: string;

  @Column(DataType.STRING)
  postalCode?: string;

  @Default('Sri Lanka')
  @Column(DataType.STRING)
  country!: string;

  // Contact Information
  @Column({ type: DataType.STRING, allowNull: false })
  phone!: string;

  @Column(DataType.STRING)
  alternatePhone?: string;

  @Column(DataType.STRING)
  fax?: string;

  @Column(DataType.STRING)
  email?: string;

  @Column(DataType.STRING)
  website?: string;

  // Branch Manager
  @Column({ type: DataType.STRING, field: 'manager_name' })
  managerName?: string;

  @Column({ type: DataType.STRING, field: 'manager_phone' })
  managerPhone?: string;

  @Column({ type: DataType.STRING, field: 'manager_email' })
  managerEmail?: string;

  // Business Details
  @Column({ type: DataType.STRING, field: 'business_reg_no' })
  businessRegNo?: string;

  @Column({ type: DataType.STRING, field: 'tax_id' })
  taxId?: string;

  // Branch Type & Services
  @Index
  @Default(BranchType.SERVICE_CENTER)
  @Column({ type: DataType.ENUM(...Object.values(BranchType)), field: 'branch_type' })
  branchType!: BranchType;

  @Column(DataType.JSON)
  services?: any;

  // Facilities
  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: 'has_service_center' })
  hasServiceCenter!: boolean;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'has_showroom' })
  hasShowroom!: boolean;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'has_parking' })
  hasParking!: boolean;

  @Column({ type: DataType.DECIMAL(10, 2), field: 'floor_area' })
  floorArea?: number;

  // Service Capacity
  @Column({ type: DataType.INTEGER, field: 'daily_capacity' })
  dailyCapacity?: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, field: 'technician_count' })
  technicianCount!: number;

  @Default(1)
  @Column({ type: DataType.INTEGER, field: 'service_counters' })
  serviceCounters!: number;

  // Operational
  @Column({ type: DataType.STRING, field: 'operating_hours' })
  operatingHours?: string;

  // Financial
  @Column({ type: DataType.DECIMAL(12, 2), field: 'monthly_target' })
  monthlyTarget?: number;

  @Column({ type: DataType.DECIMAL(12, 2), field: 'yearly_target' })
  yearlyTarget?: number;

  // Status
  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: 'is_active' })
  isActive!: boolean;

  @Column({ type: DataType.DATE, field: 'opening_date' })
  openingDate?: Date;

  @Column({ type: DataType.DATE, field: 'closure_date' })
  closureDate?: Date;

  @Column({ type: DataType.STRING, field: 'closure_reason' })
  closureReason?: string;

  // Metadata
  @Column(DataType.TEXT)
  notes?: string;

  @Column(DataType.JSON)
  images?: any;

  @Column(DataType.JSON)
  documents?: any;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relations
  @HasOne(() => Location, { foreignKey: 'branch_id', as: 'location' })
  location?: Location;

  @HasMany(() => BranchStaff, { foreignKey: 'branch_id', as: 'branchStaff' })
  branchStaff?: BranchStaff[];

  @HasMany(() => BranchTarget, { foreignKey: 'branch_id', as: 'branchTargets' })
  branchTargets?: BranchTarget[];
}

export default Branch;

