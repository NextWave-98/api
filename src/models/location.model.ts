import 'reflect-metadata';
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
  BelongsTo,
  ForeignKey,
  Index,
} from 'sequelize-typescript';
import { LocationType } from '../enums';
import { Warehouse } from './warehouse.model';
import { Branch } from './branch.model';
import { User } from './user.model';
import { Customer } from './customer.model';
import { JobSheet } from './jobsheet.model';
import { Inventory } from './inventory.model';
import { ProductInventory } from './product-inventory.model';
import { Sale } from './sale.model';
import { StockRelease } from './stock-release.model';
import { GoodsReceipt } from './goods-receipt.model';
import { WarrantyCard } from './warranty-card.model';
import { WarrantyClaim } from './warranty-claim.model';
import { ProductReturn } from './product-return.model';

@Table({
  tableName: 'locations',
  timestamps: true,
  underscored: true,
})
export class Location extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  locationCode!: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  name!: string;

  @Index
  @Default(LocationType.BRANCH)
  @Column({ type: DataType.ENUM(...Object.values(LocationType)), field: 'location_type' })
  locationType!: LocationType;

  @Column(DataType.STRING)
  address?: string;

  @Column(DataType.STRING)
  city?: string;

  @Column(DataType.STRING)
  phone?: string;

  @Column(DataType.STRING)
  phone2?: string;

  @Column(DataType.STRING)
  phone3?: string;

  @Column(DataType.STRING)
  email?: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // One-to-One with Warehouse
  @Index
  @ForeignKey(() => Warehouse)
  @Column({ type: DataType.UUID, unique: true })
  warehouseId?: string;

  @BelongsTo(() => Warehouse, 'warehouse_id')
  warehouse?: Warehouse;

  // One-to-One with Branch
  @Index
  @ForeignKey(() => Branch)
  @Column({ type: DataType.UUID, unique: true })
  branchId?: string;

  @BelongsTo(() => Branch, 'branch_id')
  branch?: Branch;

  // Relations
  @HasMany(() => User, { foreignKey: 'location_id', as: 'users' })
  users?: User[];

  @HasMany(() => Customer, { foreignKey: 'location_id', as: 'customers' })
  customers?: Customer[];

  @HasMany(() => JobSheet, { foreignKey: 'location_id', as: 'jobSheets' })
  jobSheets?: JobSheet[];

  @HasMany(() => Inventory, { foreignKey: 'location_id', as: 'inventory' })
  inventory?: Inventory[];

  @HasMany(() => ProductInventory, { foreignKey: 'location_id', as: 'productInventory' })
  productInventory?: ProductInventory[];

  @HasMany(() => Sale, { foreignKey: 'location_id', as: 'sales' })
  sales?: Sale[];

  @HasMany(() => StockRelease, { foreignKey: 'from_location_id', as: 'stockReleasesFrom' })
  stockReleasesFrom?: StockRelease[];

  @HasMany(() => StockRelease, { foreignKey: 'to_location_id', as: 'stockReleasesTo' })
  stockReleasesTo?: StockRelease[];

  @HasMany(() => GoodsReceipt, { foreignKey: 'destination_location_id', as: 'goodsReceipts' })
  goodsReceipts?: GoodsReceipt[];

  @HasMany(() => WarrantyCard, { foreignKey: 'location_id', as: 'warrantyCards' })
  warrantyCards?: WarrantyCard[];

  @HasMany(() => WarrantyClaim, { foreignKey: 'location_id', as: 'warrantyClaims' })
  warrantyClaims?: WarrantyClaim[];

  @HasMany(() => ProductReturn, { foreignKey: 'location_id', as: 'productReturns' })
  productReturns?: ProductReturn[];
}

export default Location;

