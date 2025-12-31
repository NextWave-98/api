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
import { ReleaseType, ReleaseStatus } from '../enums';
import { StockReleaseItem } from './stock-release-item.model';

@Table({
  tableName: 'stock_releases',
  timestamps: true,
  underscored: true,
})
export class StockRelease extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  releaseNumber!: string;

  @Column({
    type: DataType.ENUM(...Object.values(ReleaseType)),
    allowNull: false,
  })
  releaseType!: ReleaseType;

  @Index
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  releaseDate!: Date;

  @Column(DataType.STRING)
  referenceId?: string;

  @Column(DataType.STRING)
  referenceType?: string;

  @Column(DataType.STRING)
  referenceNumber?: string;

  @Index
  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, allowNull: false })
  fromLocationId!: string;

  @BelongsTo(() => Location, 'fromLocationId')
  fromLocation!: Location;

  @Index
  @ForeignKey(() => Location)
  @Column(DataType.UUID)
  toLocationId?: string;

  @BelongsTo(() => Location, 'toLocationId')
  toLocation?: Location;

  @Index
  @Default(ReleaseStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(ReleaseStatus)))
  status!: ReleaseStatus;

  @Column(DataType.STRING)
  requestedBy?: string;

  @Column(DataType.STRING)
  approvedBy?: string;

  @Column(DataType.DATE)
  approvedAt?: Date;

  @Column(DataType.STRING)
  releasedBy?: string;

  @Column(DataType.DATE)
  releasedAt?: Date;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relations
  @HasMany(() => StockReleaseItem, { foreignKey: 'stock_release_id', as: 'items' })
  items?: StockReleaseItem[];
}

export default StockRelease;

