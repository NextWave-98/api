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
import { WarehouseType } from '../enums';
import { Location } from './location.model';
import { WarehouseStaff } from './warehouse-staff.model';
import { InventoryZone } from './inventory-zone.model';
import { StockTransfer } from './stock-transfer.model';
import { WarehouseInventory } from './warehouse-inventory.model';

@Table({
  tableName: 'warehouses',
  timestamps: true,
  underscored: true,
})
export class Warehouse extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'warehouse_code' })
  warehouseCode!: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  name!: string;

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
  email?: string;

  @Column({ type: DataType.STRING, field: 'manager_name' })
  managerName?: string;

  @Column({ type: DataType.STRING, field: 'manager_phone' })
  managerPhone?: string;

  @Column({ type: DataType.STRING, field: 'manager_email' })
  managerEmail?: string;

  // Warehouse Specifications
  @Column({ type: DataType.DECIMAL(10, 2), field: 'total_area' })
  totalArea?: number;

  @Column({ type: DataType.INTEGER, field: 'storage_capacity' })
  storageCapacity?: number;

  @Column(DataType.JSON)
  zones?: any;

  // Facilities
  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'has_cold_storage' })
  hasColdStorage!: boolean;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: 'has_security_system' })
  hasSecuritySystem!: boolean;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'has_loading_dock' })
  hasLoadingDock!: boolean;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'has_forklift' })
  hasForklift!: boolean;

  @Column({ type: DataType.INTEGER, field: 'parking_spaces' })
  parkingSpaces?: number;

  // Warehouse Type
  @Default(WarehouseType.GENERAL)
  @Column({ type: DataType.ENUM(...Object.values(WarehouseType)), field: 'warehouse_type' })
  warehouseType!: WarehouseType;

  // Operational
  @Index
  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'is_main_warehouse' })
  isMainWarehouse!: boolean;

  @Column({ type: DataType.STRING, field: 'operating_hours' })
  operatingHours?: string;

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
  @HasOne(() => Location, { foreignKey: 'warehouse_id', as: 'location' })
  location?: Location;

  @HasMany(() => WarehouseStaff, { foreignKey: 'warehouse_id', as: 'warehouseStaff' })
  warehouseStaff?: WarehouseStaff[];

  @HasMany(() => InventoryZone, { foreignKey: 'warehouse_id', as: 'inventoryZones' })
  inventoryZones?: InventoryZone[];

  @HasMany(() => StockTransfer, { foreignKey: 'from_warehouse_id', as: 'stockTransfersFrom' })
  stockTransfersFrom?: StockTransfer[];

  @HasMany(() => StockTransfer, { foreignKey: 'to_warehouse_id', as: 'stockTransfersTo' })
  stockTransfersTo?: StockTransfer[];

  @HasMany(() => WarehouseInventory, { foreignKey: 'warehouse_id', as: 'warehouseInventory' })
  warehouseInventory?: WarehouseInventory[];
}

export default Warehouse;

