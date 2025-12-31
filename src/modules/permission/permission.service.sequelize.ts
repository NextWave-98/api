import { Permission, Role } from '../../models';
import { Op } from 'sequelize';

export class PermissionService {
  async getAllPermissions(page = 1, limit = 50, search?: string, module?: string) {
    const offset = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { module: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (module) {
      where.module = module;
    }

    const { count: total, rows: permissions } = await Permission.findAndCountAll({
      where,
      offset,
      limit,
      order: [['module', 'ASC'], ['action', 'ASC']],
    });

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc: Record<string, typeof permissions>, perm: any) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return {
      permissions: permissions.map(p => p.toJSON()),
      groupedPermissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPermissionById(id: string) {
    const permission = await Permission.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['id', 'name', 'description'],
        },
      ],
    });

    return permission ? permission.toJSON() : null;
  }
}

