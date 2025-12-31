import { AppError } from '../../shared/utils/app-error';
import { Location, User, Role } from '../../models';
import { Op } from 'sequelize';

// Legacy Branch Service - now proxies to Location model
export class BranchService {
  // Generate branch code: First 2 letters of name + 3-digit sequence number (e.g., NU001)
  private async generateBranchCode(branchName: string): Promise<string> {
    // Get first 2 letters of branch name and convert to uppercase
    const prefix = branchName.substring(0, 2).toUpperCase();
    
    // Find the highest sequence number for this prefix
    const existingBranches = await Location.findAll({
      where: {
        locationCode: {
          [Op.startsWith]: prefix,
        },
        locationType: 'BRANCH',
      },
      attributes: ['locationCode'],
      order: [['locationCode', 'DESC']],
    });

    let sequenceNumber = 1;
    
    if (existingBranches.length > 0) {
      // Extract the number part from the most recent code
      const latestCode = existingBranches[0].locationCode;
      const numberPart = latestCode.substring(prefix.length); // Get everything after the prefix
      const lastNumber = parseInt(numberPart, 10);
      
      if (!isNaN(lastNumber)) {
        sequenceNumber = lastNumber + 1;
      }
    }

    // Try to find an available code (in case of gaps in sequence)
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      const paddedNumber = sequenceNumber.toString().padStart(3, '0');
      const code = `${prefix}${paddedNumber}`;
      
      // Check if this code is available
      const exists = await Location.findOne({
        where: { locationCode: code },
      });
      
      if (!exists) {
        return code;
      }
      
      sequenceNumber++;
      attempts++;
    }
    
    throw new AppError(500, 'Unable to generate unique branch code');
  }

  async createBranch(data: {
    name: string;
    code?: string;
    address?: string;
    phone?: string;
    phone2?: string;
    phone3?: string;
    email?: string;
  }) {
    // Check if location with same name exists
    const existing = await Location.findOne({
      where: { name: data.name, locationType: 'BRANCH' },
    });

    if (existing) {
      throw new AppError(400, 'Branch with this name already exists');
    }

    // Check for duplicate address
    if (data.address) {
      const addressExists = await Location.findOne({
        where: { address: data.address, locationType: 'BRANCH' },
      });
      if (addressExists) {
        throw new AppError(400, 'A branch with this address already exists');
      }
    }

    // Check for duplicate phone
    if (data.phone) {
      const phoneExists = await Location.findOne({
        where: { phone: data.phone, locationType: 'BRANCH' },
      });
      if (phoneExists) {
        throw new AppError(400, 'A branch with this phone number already exists');
      }
    }

    // Check for duplicate email
    if (data.email) {
      const emailExists = await Location.findOne({
        where: { email: data.email, locationType: 'BRANCH' },
      });
      if (emailExists) {
        throw new AppError(400, 'A branch with this email already exists');
      }
    }

    // Generate code if not provided
    let branchCode = data.code;
    if (!branchCode) {
      branchCode = await this.generateBranchCode(data.name);
    } else {
      branchCode = branchCode.toUpperCase();
      
      // Check if custom code already exists
      const codeExists = await Location.findOne({
        where: { locationCode: branchCode },
      });
      
      if (codeExists) {
        throw new AppError(400, 'Branch with this code already exists');
      }
    }

    const branch = await Location.create({
      name: data.name,
      locationCode: branchCode,
      locationType: 'BRANCH',
      address: data.address,
      phone: data.phone,
      email: data.email,
    });

    // Get user count separately
    const userCount = await User.count({ where: { locationId: branch.id } });

    return { ...branch, code: branch.locationCode };
  }

  async getAllBranches(page = 1, limit = 10, isActive?: boolean, branch?: string) {
    const offset = (page - 1) * limit;

    const where: any = {};
    if (branch === 'warehouse') {
      where.locationType = 'WAREHOUSE';
    } else if (branch === 'branch') {
      where.locationType = 'BRANCH';
    } else if (branch === 'all') {
      // No filter, get all
    } else if (branch === undefined) {
      where.locationType = 'BRANCH'; // Default to branches
    }
    if (isActive !== undefined) where.isActive = isActive;

    const { count: total, rows: locations } = await Location.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    // Get user counts for each location
    const branchesWithCounts = await Promise.all(
      locations.map(async (loc) => {
        const userCount = await User.count({ where: { locationId: loc.id } });
        return { ...loc.toJSON(), code: loc.locationCode, _count: { users: userCount } };
      })
    );

    const branches = branchesWithCounts;

    return {
      branches,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBranchById(id: string) {
    const branch = await Location.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'email', 'name', 'isActive'],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    if (!branch) {
      throw new AppError(404, 'Branch not found');
    }

    const branchData = branch.toJSON();
    const userCount = Array.isArray(branchData.users) ? branchData.users.length : 0;

    return { ...branchData, _count: { users: userCount } };
  }

  async updateBranch(
    id: string,
    data: {
      name?: string;
      code?: string;
      address?: string;
      phone?: string;
      phone2?: string;
      phone3?: string;
      email?: string;
      isActive?: boolean;
    }
  ) {
    const existing = await Location.findByPk(id);

    if (!existing) {
      throw new AppError(404, 'Branch not found');
    }

    // Check for duplicate name or code if being updated
    if (data.name || data.code) {
      const orConditions = [];
      if (data.name) orConditions.push({ name: data.name });
      if (data.code) orConditions.push({ locationCode: data.code });

      const duplicate = await Location.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: id } },
            { [Op.or]: orConditions },
          ],
        },
      });

      if (duplicate) {
        throw new AppError(400, 'Branch with this name or code already exists');
      }
    }

    // Check for duplicate address if being updated
    if (data.address) {
      const addressExists = await Location.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: id } },
            { address: data.address },
          ],
        },
      });
      if (addressExists) {
        throw new AppError(400, 'A branch with this address already exists');
      }
    }

    // Check for duplicate phone if being updated
    if (data.phone) {
      const phoneExists = await Location.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: id } },
            { phone: data.phone },
          ],
        },
      });
      if (phoneExists) {
        throw new AppError(400, 'A branch with this phone number already exists');
      }
    }

    // Check for duplicate email if being updated
    if (data.email) {
      const emailExists = await Location.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: id } },
            { email: data.email },
          ],
        },
      });
      if (emailExists) {
        throw new AppError(400, 'A branch with this email already exists');
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.locationCode = data.code.toUpperCase();
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await Location.update(updateData, { where: { id } });

    const branch = await Location.findByPk(id);
    const userCount = await User.count({ where: { locationId: id } });

    return { ...branch!.toJSON(), _count: { users: userCount } };
  }

  async deleteBranch(id: string) {
    const existing = await Location.findByPk(id);

    if (!existing) {
      throw new AppError(404, 'Branch not found');
    }

    // Check if branch has users
    const userCount = await User.count({ where: { locationId: id } });
    if (userCount > 0) {
      throw new AppError(
        400,
        `Cannot delete branch with ${userCount} assigned user(s). Please reassign users first.`
      );
    }

    await Location.destroy({ where: { id } });

    return { message: 'Branch deleted successfully' };
  }

  async assignUserToBranch(userId: string, branchId: string) {
    // Verify user exists and get their role
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
        },
      ],
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Admin can access all branches, so don't assign them to specific branches
    if (user.role?.name === 'ADMIN') {
      throw new AppError(400, 'Admin users have access to all branches and cannot be assigned to a specific branch');
    }

    // Verify branch exists
    const branch = await Location.findByPk(branchId);

    if (!branch) {
      throw new AppError(404, 'Branch not found');
    }

    if (!branch.isActive) {
      throw new AppError(400, 'Cannot assign user to inactive branch');
    }

    // Assign user to branch
    await User.update({ locationId: branchId }, { where: { id: userId } });

    const updatedUser = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode'],
        },
      ],
    });

    const { password, refreshToken, ...userWithoutSensitive } = updatedUser!.toJSON() as any;
    const userWithLocationInfo = {
      ...userWithoutSensitive,
      locationId: updatedUser!.location ? updatedUser!.location.id : null,
      locationCode: updatedUser!.location ? (updatedUser!.location as any).locationCode : null,
    };

    return userWithLocationInfo;
  }

  async unassignUserFromBranch(userId: string) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!user.locationId) {
      throw new AppError(400, 'User is not assigned to any branch');
    }

    await User.update({ locationId: null }, { where: { id: userId } });

    const updatedUser = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name'],
        },
      ],
    });

    const { password, refreshToken, ...userWithoutSensitive } = updatedUser!.toJSON() as any;
    const userWithLocationInfo = {
      ...userWithoutSensitive,
      locationId: null,
      locationCode: null,
    };

    return userWithLocationInfo;
  }

  async getBranchUsers(branchId: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const branch = await Location.findByPk(branchId);

    if (!branch) {
      throw new AppError(404, 'Branch not found');
    }

    const { count: total, rows: users } = await User.findAndCountAll({
      where: { locationId: branchId },
      offset,
      limit,
      attributes: ['id', 'email', 'name', 'isActive', 'lastLogin', 'createdAt'],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        code: branch.locationCode,
      },
      users: users.map(u => u.toJSON()),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBranchStats(branchId: string) {
    const branch = await Location.findByPk(branchId);

    if (!branch) {
      throw new AppError(404, 'Branch not found');
    }

    const [totalUsers, activeUsers, usersByRole] = await Promise.all([
      User.count({ where: { locationId: branchId } }),
      User.count({ where: { locationId: branchId, isActive: true } }),
      User.findAll({
        where: { locationId: branchId },
        attributes: [
          'roleId',
          [User.sequelize!.fn('COUNT', User.sequelize!.col('id')), 'count'],
        ],
        group: ['roleId'],
        raw: true,
      }),
    ]);

    const roleIds = (usersByRole as any[]).map((r) => r.roleId);
    const roles = await Role.findAll({
      where: {
        id: { [Op.in]: roleIds },
      },
      attributes: ['id', 'name'],
    });

    const roleStats = (usersByRole as any[]).map((stat) => ({
      role: roles.find((r) => r.id === stat.roleId)?.name || 'Unknown',
      count: parseInt(stat.count, 10),
    }));

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        code: branch.locationCode,
      },
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersByRole: roleStats,
      },
    };
  }
}

