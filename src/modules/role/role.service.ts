import { AppError } from '../../shared/utils/app-error';
import { Role } from '../../models/role.model';
import { Permission } from '../../models/permission.model';
import { User } from '../../models/user.model';
import { Op } from 'sequelize';
import sequelize from '../../shared/config/database';

export class RoleService {
  async createRole(data: {
    name: string;
    description?: string;
    permissionNames?: string[];
  }) {
    const existing = await Role.findOne({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError(400, 'Role with this name already exists');
    }

    // Create role
    const role = await Role.create({
      name: data.name,
      description: data.description,
    });

    // Add permissions if provided
    if (data.permissionNames && data.permissionNames.length > 0) {
      const permissions = await Permission.findAll({
        where: { name: { [Op.in]: data.permissionNames } },
      });
      await role.$set('permissions', permissions);
    }

    // Reload with permissions
    await role.reload({
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'description', 'module', 'action'],
        },
      ],
    });

    return role;
  }

  async getAllRoles(page = 1, limit = 10, search?: string) {
    const offset = (page - 1) * limit;

    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    const { rows: roles, count: total } = await Role.findAndCountAll({
      where,
      offset,
      limit,
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'description', 'module', 'action'],
        },
      ],
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    // Count users for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.count({ where: { roleId: role.id } });
        return {
          ...role.toJSON(),
          _count: { users: userCount },
        };
      })
    );

    return {
      roles: rolesWithCounts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRoleById(id: string) {
    const role = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'description', 'module', 'action'],
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'email', 'name', 'isActive'],
        },
      ],
    });

    if (!role) {
      throw new AppError(404, 'Role not found');
    }

    return role;
  }

  async updateRole(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      permissionNames?: string[];
    }
  ) {
    const role = await Role.findByPk(id);

    if (!role) {
      throw new AppError(404, 'Role not found');
    }

    if (data.name && data.name !== role.name) {
      const existing = await Role.findOne({
        where: { name: data.name },
      });

      if (existing) {
        throw new AppError(400, 'Role name already exists');
      }
    }

    // Update basic fields
    if (data.name !== undefined) role.name = data.name;
    if (data.description !== undefined) role.description = data.description;
    if (data.isActive !== undefined) role.isActive = data.isActive;
    
    await role.save();

    // Update permissions if provided
    if (data.permissionNames) {
      const permissions = await Permission.findAll({
        where: { name: { [Op.in]: data.permissionNames } },
      });
      await role.$set('permissions', permissions);
    }

    // Reload with permissions
    await role.reload({
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'description', 'module', 'action'],
        },
      ],
    });

    return role;
  }

  async deleteRole(id: string) {
    const role = await Role.findByPk(id);

    if (!role) {
      throw new AppError(404, 'Role not found');
    }

    const userCount = await User.count({ where: { roleId: id } });

    if (userCount > 0) {
      throw new AppError(400, 'Cannot delete role with active users');
    }

    await role.destroy();

    return { message: 'Role deleted successfully' };
  }
}

