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
import { WarrantyCard } from './warranty-card.model';
import { JobSheet } from './jobsheet.model';
import { Product } from './product.model';
import { User } from './user.model';
import { Location } from './location.model';
import { ClaimStatus, ClaimPriority, ResolutionType } from '../enums';

@Table({
  tableName: 'warranty_claims',
  timestamps: true,
  underscored: true,
})
export class WarrantyClaim extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'claim_number' })
  claimNumber!: string;

  // Warranty Card
  @Index
  @ForeignKey(() => WarrantyCard)
  @Column({ type: DataType.UUID, allowNull: false, field: 'warranty_card_id' })
  warrantyCardId!: string;

  @BelongsTo(() => WarrantyCard)
  warrantyCard!: WarrantyCard;

  // Claim Details
  @Index
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'claim_date' })
  claimDate!: Date;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'issue_description' })
  issueDescription!: string;

  @Column({ type: DataType.STRING, allowNull: false, field: 'issue_type' })
  issueType!: string;

  // Status
  @Index
  @Default(ClaimStatus.SUBMITTED)
  @Column({ type: DataType.ENUM(...Object.values(ClaimStatus)), field: 'status' })
  status!: ClaimStatus;

  @Default(ClaimPriority.MEDIUM)
  @Column({ type: DataType.ENUM(...Object.values(ClaimPriority)), field: 'priority' })
  priority!: ClaimPriority;

  // Resolution
  @Column({ type: DataType.ENUM(...Object.values(ResolutionType)), field: 'resolution_type' })
  resolutionType?: ResolutionType;

  @Column({ type: DataType.TEXT, field: 'resolution_notes' })
  resolutionNotes?: string;

  @Column({ type: DataType.DATE, field: 'resolution_date' })
  resolutionDate?: Date;

  // Link to JobSheet
  @Index
  @ForeignKey(() => JobSheet)
  @Column({ type: DataType.UUID, unique: true, field: 'job_sheet_id' })
  jobSheetId?: string;

  @BelongsTo(() => JobSheet)
  jobSheet?: JobSheet;

  // Replacement Product
  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, field: 'replacement_product_id' })
  replacementProductId?: string;

  @BelongsTo(() => Product, 'replacementProductId')
  replacementProduct?: Product;

  // Staff
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'submitted_by_id' })
  submittedById?: string;

  @BelongsTo(() => User, 'submittedById')
  submittedBy?: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'assigned_to_id' })
  assignedToId?: string;

  @BelongsTo(() => User, 'assignedToId')
  assignedTo?: User;

  // Location
  @Index
  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, allowNull: false, field: 'location_id' })
  locationId!: string;

  @BelongsTo(() => Location)
  location!: Location;

  // Costs
  @Column({ type: DataType.DECIMAL(10, 2), field: 'estimated_cost' })
  estimatedCost?: number;

  @Column({ type: DataType.DECIMAL(10, 2), field: 'actual_cost' })
  actualCost?: number;

  @Column({ type: DataType.DECIMAL(10, 2), field: 'customer_charge' })
  customerCharge?: number;

  // Metadata
  @Column({ type: DataType.JSON, field: 'images' })
  images?: any;

  @Column({ type: DataType.JSON, field: 'documents' })
  documents?: any;

  @Column({ type: DataType.TEXT, field: 'notes' })
  notes?: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  updatedAt!: Date;
}

export default WarrantyClaim;

