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
  HasMany,
  BelongsToMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Permission } from './permission.model';

@Table({
  tableName: 'roles',
  timestamps: true,
  underscored: true,
})
export class Role extends Model {
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

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  // Relationships
  @HasMany(() => User, { foreignKey: 'role_id', as: 'users' })
  users?: User[];

  @BelongsToMany(() => Permission, {
    through: '_PermissionToRole',
    foreignKey: 'b',
    otherKey: 'a',
    as: 'permissions',
    timestamps: false,
  })
  permissions?: Permission[];
}

export default Role;

