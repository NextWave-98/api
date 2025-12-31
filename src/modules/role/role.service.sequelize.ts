import { AppError } from '../../shared/utils/app-error';
import { Role, Permission, User } from '../../models';
import { Op } from 'sequelize';

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

    const role = await Role.create({
      name: data.name,
      description: data.description,
    });

    // Add permissions if provided
    if (data.permissionNames && data.permissionNames.length > 0) {
      const permissions = await Permission.findAll({
        where: { name: { [Op.in]: data.permissionNames } },
      });

      if (permissions.length !== data.permissionNames.length) {
        throw new AppError(400, 'Some permissions not found');
      }

      await (role as any).$set('permissions', permissions);
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

    return role.toJSON();
  }

  async getAllRoles(page = 1, limit = 10, search?: string) {
    const offset = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count: total, rows: roles } = await Role.findAndCountAll({
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

    // Add user count for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.count({
          where: { roleId: role.id },
        });
        const roleData = role.toJSON();
        return {
          ...roleData,
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

    const roleData = role.toJSON();

    // Add user count
    const userCount = await User.count({
      where: { roleId: role.id },
    });
    return {
      ...roleData,
      _count: { users: userCount },
    };
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

    // Update role
    await role.update({
      name: data.name,
      description: data.description,
      isActive: data.isActive,
    });

    // Update permissions if provided
    if (data.permissionNames !== undefined) {
      if (data.permissionNames.length > 0) {
        const permissions = await Permission.findAll({
          where: { name: { [Op.in]: data.permissionNames } },
        });

        if (permissions.length !== data.permissionNames.length) {
          throw new AppError(400, 'Some permissions not found');
        }

        await (role as any).$set('permissions', permissions);
      } else {
        await (role as any).$set('permissions', []);
      }
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

    return role.toJSON();
  }

  async deleteRole(id: string) {
    const role = await Role.findByPk(id);

    if (!role) {
      throw new AppError(404, 'Role not found');
    }

    const userCount = await User.count({
      where: { roleId: role.id },
    });

    if (userCount > 0) {
      throw new AppError(400, 'Cannot delete role with active users');
    }

    await role.destroy();

    return { message: 'Role deleted successfully' };
  }
}

