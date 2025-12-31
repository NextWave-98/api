import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { Role } from './role.model';
import { Permission } from './permission.model';

@Table({
  tableName: '_PermissionToRole',
  timestamps: false,
  underscored: false,
})
export class RolePermission extends Model {
  @Index
  @ForeignKey(() => Permission)
  @Column({ type: DataType.UUID, allowNull: false, field: 'a' })
  a!: string;

  @BelongsTo(() => Permission, { foreignKey: 'a' })
  permission!: Permission;

  @Index
  @ForeignKey(() => Role)
  @Column({ type: DataType.UUID, allowNull: false, field: 'b' })
  b!: string;

  @BelongsTo(() => Role, { foreignKey: 'b' })
  role!: Role;
}

export default RolePermission;
