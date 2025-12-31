const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');

const writeModel = (filename, content) => {
  const filePath = path.join(modelsDir, filename);
  fs.writeFileSync(filePath, content.trim());
  console.log(`✓ Created ${filename}`);
};

const models = {
  'Sale.ts': `
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  Index,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Customer } from './Customer';
import { Location } from './Location';
import { User } from './User';
import { SaleItem } from './SaleItem';
import { SalePayment } from './SalePayment';
import { SaleRefund } from './SaleRefund';
import { WarrantyCard } from './WarrantyCard';
import { Notification } from './Notification';

export enum SaleType {
  DIRECT = 'DIRECT',
  ONLINE = 'ONLINE',
  PHONE = 'PHONE',
  WHOLESALE = 'WHOLESALE',
}

export enum SaleStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
}

@Table({
  tableName: 'sales',
  timestamps: true,
})
export class Sale extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  saleNumber!: string;

  @Index
  @ForeignKey(() => Customer)
  @Column(DataType.UUID)
  customerId?: string;

  @Column(DataType.STRING)
  customerName?: string;

  @Column(DataType.STRING)
  customerPhone?: string;

  @Column(DataType.STRING)
  customerEmail?: string;

  @Index
  @ForeignKey(() => Location)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  locationId!: string;

  @Index
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  soldById!: string;

  @Default('DIRECT')
  @Column(DataType.ENUM(...Object.values(SaleType)))
  saleType!: SaleType;

  @Default('POS')
  @Column(DataType.STRING)
  saleChannel!: string;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  subtotal!: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  discount!: number;

  @Column(DataType.ENUM(...Object.values(DiscountType)))
  discountType?: DiscountType;

  @Column(DataType.STRING)
  discountReason?: string;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  tax!: number;

  @Default(0)
  @Column(DataType.DECIMAL(5, 2))
  taxRate!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  totalAmount!: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  paidAmount!: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  balanceAmount!: number;

  @Default('PENDING')
  @Column(DataType.ENUM(...Object.values(PaymentStatus)))
  paymentStatus!: PaymentStatus;

  @Column(DataType.STRING)
  paymentMethod?: string;

  @Column(DataType.STRING)
  paymentReference?: string;

  @Index
  @Default('COMPLETED')
  @Column(DataType.ENUM(...Object.values(SaleStatus)))
  status!: SaleStatus;

  @Column(DataType.TEXT)
  notes?: string;

  @Column(DataType.STRING)
  invoiceUrl?: string;

  @CreatedAt
  @Index
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  @Column(DataType.DATE)
  completedAt?: Date;

  @Column(DataType.DATE)
  cancelledAt?: Date;

  @BelongsTo(() => Customer)
  customer?: Customer;

  @BelongsTo(() => Location)
  location!: Location;

  @BelongsTo(() => User, 'soldById')
  soldBy!: User;

  @HasMany(() => SaleItem)
  items!: SaleItem[];

  @HasMany(() => SalePayment)
  payments!: SalePayment[];

  @HasMany(() => SaleRefund)
  refunds!: SaleRefund[];

  @HasMany(() => WarrantyCard)
  warrantyCards!: WarrantyCard[];

  @HasMany(() => Notification)
  notifications!: Notification[];
}
`,

  'SaleItem.ts': `
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  Index,
  ForeignKey,
  BelongsTo,
  HasOne,
} from 'sequelize-typescript';
import { Sale } from './Sale';
import { Product } from './Product';
import { WarrantyCard } from './WarrantyCard';

@Table({
  tableName: 'sale_items',
  timestamps: false,
})
export class SaleItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => Sale)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  saleId!: string;

  @Index
  @ForeignKey(() => Product)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  productId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  productName!: string;

  @Column(DataType.STRING)
  productSKU?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  quantity!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  unitPrice!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  costPrice!: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  discount!: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  tax!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  subtotal!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  warrantyMonths!: number;

  @Column(DataType.DATE)
  warrantyExpiry?: Date;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @BelongsTo(() => Sale, { onDelete: 'CASCADE' })
  sale!: Sale;

  @BelongsTo(() => Product)
  product!: Product;

  @HasOne(() => WarrantyCard)
  warrantyCard?: WarrantyCard;
}
`,

  'SalePayment.ts': `
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  Index,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Sale, PaymentStatus } from './Sale';
import { User } from './User';
import { PaymentMethod } from './Payment';

@Table({
  tableName: 'sale_payments',
  timestamps: false,
})
export class SalePayment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  paymentNumber!: string;

  @Index
  @ForeignKey(() => Sale)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  saleId!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount!: number;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: false,
  })
  paymentMethod!: PaymentMethod;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  paymentDate!: Date;

  @Column(DataType.STRING)
  reference?: string;

  @Default('COMPLETED')
  @Column(DataType.ENUM(...Object.values(PaymentStatus)))
  status!: PaymentStatus;

  @Column(DataType.STRING)
  notes?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  receivedById!: string;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @BelongsTo(() => Sale, { onDelete: 'CASCADE' })
  sale!: Sale;

  @BelongsTo(() => User)
  receivedBy!: User;
}
`,

  'SaleRefund.ts': `
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  Index,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Sale } from './Sale';
import { User } from './User';
import { PaymentMethod } from './Payment';

@Table({
  tableName: 'sale_refunds',
  timestamps: false,
})
export class SaleRefund extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  refundNumber!: string;

  @Index
  @ForeignKey(() => Sale)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  saleId!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  reason!: string;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: false,
  })
  refundMethod!: PaymentMethod;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  refundDate!: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  processedById!: string;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @BelongsTo(() => Sale)
  sale!: Sale;

  @BelongsTo(() => User)
  processedBy!: User;
}
`,

  'ProductInventory.ts': `
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  Index,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Product } from './Product';
import { Location } from './Location';

@Table({
  tableName: 'product_inventory',
  timestamps: true,
})
export class ProductInventory extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => Product)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  productId!: string;

  @Index
  @ForeignKey(() => Location)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  locationId!: string;

  @Index
  @Default(0)
  @Column(DataType.INTEGER)
  quantity!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  reservedQuantity!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  availableQuantity!: number;

  @Column(DataType.STRING)
  storageLocation?: string;

  @Column(DataType.STRING)
  zone?: string;

  @Column(DataType.INTEGER)
  minStockLevel?: number;

  @Column(DataType.INTEGER)
  maxStockLevel?: number;

  @Column(DataType.DATE)
  lastRestocked?: Date;

  @Column(DataType.DATE)
  lastStockCheck?: Date;

  @Column(DataType.DATE)
  nextStockCheck?: Date;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  averageCost!: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  totalValue!: number;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  @BelongsTo(() => Product)
  product!: Product;

  @BelongsTo(() => Location)
  location!: Location;
}
`,

  'JobSheetProduct.ts': `
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  Index,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { JobSheet } from './JobSheet';
import { Product } from './Product';

export enum JobProductStatus {
  PENDING = 'PENDING',
  RESERVED = 'RESERVED',
  INSTALLED = 'INSTALLED',
  RETURNED = 'RETURNED',
  DEFECTIVE = 'DEFECTIVE',
}

@Table({
  tableName: 'job_sheet_products',
  timestamps: true,
})
export class JobSheetProduct extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => JobSheet)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  jobSheetId!: string;

  @Index
  @ForeignKey(() => Product)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  productId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  quantity!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  unitPrice!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  costPrice!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  totalPrice!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  warrantyMonths!: number;

  @Column(DataType.STRING)
  serialNumber?: string;

  @Column(DataType.STRING)
  batchNumber?: string;

  @Default('PENDING')
  @Column(DataType.ENUM(...Object.values(JobProductStatus)))
  status!: JobProductStatus;

  @Column(DataType.DATE)
  installedDate?: Date;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  @BelongsTo(() => JobSheet, { onDelete: 'CASCADE' })
  jobSheet!: JobSheet;

  @BelongsTo(() => Product)
  product!: Product;
}
`,
};

Object.keys(models).forEach((filename) => {
  writeModel(filename, models[filename]);
});

console.log('\\n✓ All sale-related models created successfully!');
