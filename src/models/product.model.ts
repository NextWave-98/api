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
import { ProductCategory } from './product-category.model';
import { Warehouse } from './warehouse.model';
import { WarrantyType, QualityGrade } from '../enums';
import { ProductInventory } from './product-inventory.model';
import { SupplierProduct } from './supplier-product.model';
import { PurchaseOrderItem } from './purchase-order-item.model';
import { ProductStockMovement } from './product-stock-movement.model';
import { JobSheetProduct } from './jobsheet-product.model';
import { StockReleaseItem } from './stock-release-item.model';
import { SaleItem } from './sale-item.model';
import { WarrantyCard } from './warranty-card.model';
import { WarrantyClaim } from './warranty-claim.model';
import { ProductReturn } from './product-return.model';
import { GoodsReceiptItem } from './goods-receipt-item.model';

@Table({
  tableName: 'products',
  timestamps: true,
  underscored: true,
})
export class Product extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: false, field: 'product_code' })
  productCode!: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: true })
  sku?: string;

  @Index
  @Column({ type: DataType.STRING, unique: true, allowNull: true })
  barcode?: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column(DataType.TEXT)
  description?: string;

  // Category
  @Index
  @ForeignKey(() => ProductCategory)
  @Column({ type: DataType.UUID, allowNull: false, field: 'category_id' })
  categoryId!: string;

  @BelongsTo(() => ProductCategory)
  category!: ProductCategory;

  // Warehouse
  @Index
  @ForeignKey(() => Warehouse)
  @Column({ type: DataType.UUID, field: 'warehouse_id' })
  warehouseId?: string;

  @BelongsTo(() => Warehouse)
  warehouse?: Warehouse;

  // Product Details
  @Index
  @Column(DataType.STRING)
  brand?: string;

  @Column(DataType.STRING)
  model?: string;

  @Column(DataType.TEXT)
  compatibility?: string;

  @Column(DataType.JSON)
  specifications?: any;

  // Pricing
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'unit_price' })
  unitPrice!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'cost_price' })
  costPrice!: number;

  @Column({ type: DataType.DECIMAL(10, 2), field: 'wholesale_price' })
  wholesalePrice?: number;

  @Column({ type: DataType.DECIMAL(5, 2), field: 'margin_percentage' })
  marginPercentage?: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false, field: 'tax_rate' })
  taxRate!: number;

  // Stock Management
  @Default(5)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'min_stock_level' })
  minStockLevel!: number;

  @Default(100)
  @Column({ type: DataType.INTEGER, field: 'max_stock_level' })
  maxStockLevel?: number;

  @Default(10)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'reorder_level' })
  reorderLevel!: number;

  @Default(20)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'reorder_quantity' })
  reorderQuantity!: number;

  // Physical Properties
  @Column({ type: DataType.DECIMAL(10, 2) })
  weight?: number;

  @Column(DataType.STRING)
  dimensions?: string;

  // Warranty & Quality
  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'warranty_months' })
  warrantyMonths!: number;

  @Default(WarrantyType.STANDARD)
  @Column({ 
    type: DataType.ENUM(...Object.values(WarrantyType)), 
    allowNull: false, 
    field: 'warranty_type' 
  })
  warrantyType!: WarrantyType;

  @Default(QualityGrade.A_GRADE)
  @Column({ 
    type: DataType.ENUM(...Object.values(QualityGrade)), 
    allowNull: false, 
    field: 'quality_grade' 
  })
  qualityGrade!: QualityGrade;

  // Warranty Terms & Conditions
  @Column(DataType.TEXT)
  terms?: string;

  @Column(DataType.TEXT)
  coverage?: string;

  @Column(DataType.TEXT)
  exclusions?: string;

  // Status
  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false, field: 'is_active' })
  isActive!: boolean;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false, field: 'is_discontinued' })
  isDiscontinued!: boolean;

  @Column({ type: DataType.DATE, field: 'discontinued_date' })
  discontinuedDate?: Date;

  // Images
  @Column(DataType.JSON)
  images?: any;

  @Column({ type: DataType.STRING, field: 'primary_image' })
  primaryImage?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Relations
  @HasMany(() => ProductInventory, { foreignKey: 'product_id', as: 'inventory' })
  inventory?: ProductInventory[];

  @HasMany(() => SupplierProduct, { foreignKey: 'product_id', as: 'supplierProducts' })
  supplierProducts?: SupplierProduct[];

  @HasMany(() => PurchaseOrderItem, { foreignKey: 'product_id', as: 'purchaseOrderItems' })
  purchaseOrderItems?: PurchaseOrderItem[];

  @HasMany(() => ProductStockMovement, { foreignKey: 'product_id', as: 'stockMovements' })
  stockMovements?: ProductStockMovement[];

  @HasMany(() => JobSheetProduct, { foreignKey: 'product_id', as: 'jobSheets' })
  jobSheetProducts?: JobSheetProduct[];

  @HasMany(() => StockReleaseItem, { foreignKey: 'product_id', as: 'stockReleases' })
  stockReleases?: StockReleaseItem[];

  @HasMany(() => SaleItem, { foreignKey: 'product_id', as: 'saleItems' })
  saleItems?: SaleItem[];

  @HasMany(() => WarrantyCard, { foreignKey: 'product_id', as: 'warrantyCards' })
  warrantyCards?: WarrantyCard[];

  @HasMany(() => WarrantyClaim, { foreignKey: 'replacement_product_id', as: 'replacementClaims' })
  replacementClaims?: WarrantyClaim[];

  @HasMany(() => ProductReturn, { foreignKey: 'product_id', as: 'productReturns' })
  productReturns?: ProductReturn[];

  @HasMany(() => GoodsReceiptItem, { foreignKey: 'product_id', as: 'goodsReceiptItems' })
  goodsReceiptItems?: GoodsReceiptItem[];
}

export default Product;

