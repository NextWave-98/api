import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  Index,
  BelongsToMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Role } from './role.model';

@Table({
  tableName: 'permissions',
  timestamps: true,
  underscored: true,
})
export class Permission extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  description?: string;

  @AllowNull(false)
  @Index
  @Column(DataType.STRING)
  module!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  action!: string;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  // Relationships
  @BelongsToMany(() => Role, {
    through: '_PermissionToRole',
    foreignKey: 'a',
    otherKey: 'b',
    as: 'roles',
    timestamps: false,
  })
  roles?: Role[];
}

export default Permission;

