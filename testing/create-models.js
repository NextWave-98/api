const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');

// Helper to write model files
const writeModel = (filename, content) => {
  const filePath = path.join(modelsDir, filename);
  fs.writeFileSync(filePath, content.trim());
  console.log(`✓ Created ${filename}`);
};

// Create all remaining models
const models = {
  'Repair.ts': `
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

export enum RepairStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Table({
  tableName: 'repairs',
  timestamps: true,
})
export class Repair extends Model {
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

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  repairType!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  description!: string;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  cost!: number;

  @Column(DataType.DATE)
  startTime?: Date;

  @Column(DataType.DATE)
  endTime?: Date;

  @Default('PENDING')
  @Column(DataType.ENUM(...Object.values(RepairStatus)))
  status!: RepairStatus;

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
}
`,

  'Part.ts': `
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
  HasMany,
} from 'sequelize-typescript';
import { Inventory } from './Inventory';
import { JobSheetPart } from './JobSheetPart';
import { StockMovement } from './StockMovement';

export enum PartCategory {
  SCREEN = 'SCREEN',
  BATTERY = 'BATTERY',
  CHARGER = 'CHARGER',
  BACK_COVER = 'BACK_COVER',
  CAMERA = 'CAMERA',
  SPEAKER = 'SPEAKER',
  MICROPHONE = 'MICROPHONE',
  CHARGING_PORT = 'CHARGING_PORT',
  HEADPHONE_JACK = 'HEADPHONE_JACK',
  BUTTON = 'BUTTON',
  FLEX_CABLE = 'FLEX_CABLE',
  MOTHERBOARD = 'MOTHERBOARD',
  RAM = 'RAM',
  STORAGE = 'STORAGE',
  OTHER = 'OTHER',
}

@Table({
  tableName: 'parts',
  timestamps: true,
})
export class Part extends Model {
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
  partNumber!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column(DataType.TEXT)
  description?: string;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(PartCategory)),
    allowNull: false,
  })
  category!: PartCategory;

  @Column(DataType.STRING)
  brand?: string;

  @Column(DataType.STRING)
  model?: string;

  @Column(DataType.TEXT)
  compatibility?: string;

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

  @Default(5)
  @Column(DataType.INTEGER)
  minStockLevel!: number;

  @Default(10)
  @Column(DataType.INTEGER)
  reorderLevel!: number;

  @Column(DataType.STRING)
  supplier?: string;

  @Column(DataType.STRING)
  supplierContact?: string;

  @Default(0)
  @Column(DataType.INTEGER)
  warrantyMonths!: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  @HasMany(() => Inventory)
  inventory!: Inventory[];

  @HasMany(() => JobSheetPart)
  jobSheetParts!: JobSheetPart[];

  @HasMany(() => StockMovement)
  stockMovements!: StockMovement[];
}
`,

  'Inventory.ts': `
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
import { Part } from './Part';
import { Location } from './Location';

@Table({
  tableName: 'inventory',
  timestamps: true,
})
export class Inventory extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => Part)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  partId!: string;

  @Index
  @ForeignKey(() => Location)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  locationId!: string;

  @Default(0)
  @Column(DataType.INTEGER)
  quantity!: number;

  @Column(DataType.STRING)
  storageLocation?: string;

  @Column(DataType.DATE)
  lastRestocked?: Date;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  @BelongsTo(() => Part)
  part!: Part;

  @BelongsTo(() => Location)
  location!: Location;
}
`,

  'JobSheetPart.ts': `
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
import { Part } from './Part';

@Table({
  tableName: 'job_sheet_parts',
  timestamps: true,
})
export class JobSheetPart extends Model {
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
  @ForeignKey(() => Part)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  partId!: string;

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
  totalPrice!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  warrantyMonths!: number;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  @BelongsTo(() => JobSheet, { onDelete: 'CASCADE' })
  jobSheet!: JobSheet;

  @BelongsTo(() => Part)
  part!: Part;
}
`,

  'StockMovement.ts': `
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
import { Part } from './Part';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
  DAMAGED = 'DAMAGED',
}

@Table({
  tableName: 'stock_movements',
  timestamps: false,
})
export class StockMovement extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => Part)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  partId!: string;

  @Column({
    type: DataType.ENUM(...Object.values(MovementType)),
    allowNull: false,
  })
  movementType!: MovementType;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  quantity!: number;

  @Column(DataType.STRING)
  referenceId?: string;

  @Column(DataType.STRING)
  referenceType?: string;

  @Column(DataType.TEXT)
  notes?: string;

  @Index
  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @BelongsTo(() => Part)
  part!: Part;
}
`,

  'Payment.ts': `
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
import { Customer } from './Customer';
import { User } from './User';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  CHECK = 'CHECK',
  OTHER = 'OTHER',
}

@Table({
  tableName: 'payments',
  timestamps: true,
})
export class Payment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  paymentNumber!: string;

  @Index
  @ForeignKey(() => JobSheet)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  jobSheetId!: string;

  @Index
  @ForeignKey(() => Customer)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  customerId!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  receivedById!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount!: number;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: false,
  })
  paymentMethod!: PaymentMethod;

  @Index
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  paymentDate!: Date;

  @Column(DataType.STRING)
  reference?: string;

  @Column(DataType.TEXT)
  notes?: string;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  @BelongsTo(() => JobSheet)
  jobSheet!: JobSheet;

  @BelongsTo(() => Customer)
  customer!: Customer;

  @BelongsTo(() => User)
  receivedBy!: User;
}
`,

  'JobStatusHistory.ts': `
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  Index,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { JobSheet, JobStatus } from './JobSheet';

@Table({
  tableName: 'job_status_history',
  timestamps: false,
})
export class JobStatusHistory extends Model {
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

  @Column(DataType.ENUM(...Object.values(JobStatus)))
  fromStatus?: JobStatus;

  @Column({
    type: DataType.ENUM(...Object.values(JobStatus)),
    allowNull: false,
  })
  toStatus!: JobStatus;

  @Index
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  changedAt!: Date;

  @Column(DataType.TEXT)
  remarks?: string;

  @BelongsTo(() => JobSheet, { onDelete: 'CASCADE' })
  jobSheet!: JobSheet;
}
`,

  'ActivityLog.ts': `
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
import { User } from './User';

@Table({
  tableName: 'activity_logs',
  timestamps: false,
})
export class ActivityLog extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Index
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  action!: string;

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  module!: string;

  @Column(DataType.STRING)
  recordId?: string;

  @Column(DataType.JSON)
  details?: any;

  @Column(DataType.STRING)
  ipAddress?: string;

  @Column(DataType.TEXT)
  userAgent?: string;

  @Index
  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @BelongsTo(() => User)
  user!: User;
}
`,
};

// Write all models
Object.keys(models).forEach((filename) => {
  writeModel(filename, models[filename]);
});

console.log('\\n✓ All models created successfully!');
