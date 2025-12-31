import bcrypt from 'bcryptjs';
import { AppError } from '../../shared/utils/app-error';
import { User, Role, Staff, Location, JobSheet, Sale, ActivityLog } from '../../models';
import { Op, UniqueConstraintError } from 'sequelize';
import sequelize  from '../../shared/config/database';

export class UserService {
  /**
   * Generate next staff ID in format SEF0001, SEF0002, etc.
   */
  private async generateStaffId(): Promise<string> {
    const lastStaff = await Staff.findOne({
      order: [['staffId', 'DESC']],
      attributes: ['staffId'],
    });

    if (!lastStaff) {
      return 'SEF0001';
    }

    // Extract number from last staff ID (e.g., SEF0001 -> 1)
    const lastNumber = parseInt(lastStaff.staffId.replace('SEF', ''), 10);
    const nextNumber = lastNumber + 1;

    // Format with leading zeros (SEF0001, SEF0002, etc.)
    return `SEF${nextNumber.toString().padStart(4, '0')}`;
  }

  async createUser(data: { 
    email: string; 
    name: string; 
    password: string; 
    roleId: string;
    nicNumber?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
  }) {
    const existing = await User.findOne({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError(400, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Get role information to check if we need to create a staff record
    const role = await Role.findByPk(data.roleId);

    if (!role) {
      throw new AppError(404, 'Role not found');
    }

    // Check if NIC is required and provided for staff-type users
    const isStaffType = ['ADMIN', 'MANAGER', 'STAFF'].includes(role.name);
    
    if (isStaffType && data.nicNumber) {
      const existingNIC = await Staff.findOne({
        where: { nicNumber: data.nicNumber },
      });

      if (existingNIC) {
        throw new AppError(400, 'NIC number already exists');
      }
    }

    // Create user and staff record in a transaction
    let result;
    try {
      result = await sequelize.transaction(async (t) => {
        const user = await User.create({
          email: data.email,
          name: data.name,
          password: hashedPassword,
          roleId: data.roleId,
        }, { transaction: t });

        // Load role relation
        await user.reload({
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name', 'description'],
            },
          ],
          transaction: t,
        });

        // Auto-create staff record for ADMIN, MANAGER, and STAFF roles
        if (isStaffType) {
          const staffId = await this.generateStaffId();
          
          await Staff.create({
            staffId,
            userId: user.id,
            nicNumber: data.nicNumber || `TEMP-${user.id.substring(0, 8)}`, // Temporary NIC if not provided
            phoneNumber: data.phoneNumber || data.email,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            joiningDate: new Date(),
          }, { transaction: t });
        }

        return user;
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const field = error.errors[0]?.path;
        if (field === 'email') {
          throw new AppError(400, 'Email already exists');
        }
        if (field === 'phoneNumber') {
          throw new AppError(400, 'Phone number already exists');
        }
        throw new AppError(400, 'Duplicate entry');
      }
      throw error;
    }

    const { password, refreshToken, ...userWithoutSensitive } = result.toJSON();
    return userWithoutSensitive;
  }

  async getAllUsers(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      offset,
      limit,
      attributes: {
        exclude: ['password', 'refreshToken'],
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode'],
        },
      ],
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    return {
      users: users.map(user => user.toJSON()),
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await User.findByPk(id, {
      attributes: {
        exclude: ['password', 'refreshToken'],
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
          include: [
            {
              association: 'permissions',
              attributes: ['id', 'name', 'description', 'module', 'action'],
            },
          ],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode', 'address', 'phone', 'email'],
        },
      ],
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user.toJSON();
  }

  async updateUser(
    id: string,
    data: { name?: string; email?: string; roleId?: string; isActive?: boolean }
  ) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (data.email && data.email !== user.email) {
      const existing = await User.findOne({
        where: { email: data.email },
      });

      if (existing) {
        throw new AppError(400, 'Email already in use');
      }
    }

    await user.update(data);

    // Reload with relations
    await user.reload({
      attributes: {
        exclude: ['password', 'refreshToken'],
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode'],
        },
      ],
    });

    return user.toJSON();
  }

  async deleteUser(id: string) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await user.destroy();

    return { message: 'User deleted successfully' };
  }

  async getProfile(userId: string) {
    console.log('🔍 DEBUG - getProfile Service - START:', {
      userId,
      type: typeof userId,
      length: userId?.length,
      trimmed: userId?.trim(),
      equals: userId === '538ea19f-c36b-4356-af04-885620f9be02'
    });
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'name', 'isActive', 'lastLogin', 'createdAt'],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode', 'locationType'],
        },
        {
          model: Staff,
          as: 'staff',
          attributes: [
            'id', 'staffId', 'nicNumber', 'dateOfBirth', 'address',
            'phoneNumber', 'additionalPhone', 'emergencyContact',
            'emergencyName', 'emergencyRelation', 'qualifications',
            'experience', 'joiningDate', 'profileImage', 'notes'
          ],
        },
      ],
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user.toJSON();
  }

  async updateProfile(userId: string, data: {
    name: string;
    email: string;
    phoneNumber?: string;
    additionalPhone?: string;
    address?: string;
    nicNumber: string;
    dateOfBirth?: string;
    emergencyContact?: string;
    emergencyName?: string;
    emergencyRelation?: string;
    qualifications?: string;
    experience?: string;
    notes?: string;
  }) {
    const user = await User.findByPk(userId, {
      include: [{ model: Staff, as: 'staff' }],
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Check if email is being changed and if it's already in use
    if (data.email !== user.email) {
      const existing = await User.findOne({
        where: { email: data.email },
      });

      if (existing) {
        throw new AppError(400, 'Email already in use');
      }
    }

    // Check if NIC is being changed and if it's already in use
    if (!user.staff || data.nicNumber !== user.staff.nicNumber) {
      const existing = await Staff.findOne({
        where: { nicNumber: data.nicNumber },
      });

      if (existing && (!user.staff || existing.userId !== userId)) {
        throw new AppError(400, 'NIC number already in use');
      }
    }

    // Update user and either update or create staff in a transaction
    const result = await sequelize.transaction(async (t) => {
      await user.update({
        name: data.name,
        email: data.email,
      }, { transaction: t });

      // Reload user with relations
      await user.reload({
        attributes: ['id', 'email', 'name', 'isActive', 'lastLogin', 'createdAt'],
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'name', 'description'],
          },
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'locationCode', 'locationType'],
          },
        ],
        transaction: t,
      });

      let staffRecord;

      if (user.staff) {
        // Update existing staff
        staffRecord = await user.staff.update({
          phoneNumber: data.phoneNumber,
          additionalPhone: data.additionalPhone,
          address: data.address,
          nicNumber: data.nicNumber,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          emergencyContact: data.emergencyContact,
          emergencyName: data.emergencyName,
          emergencyRelation: data.emergencyRelation,
          qualifications: data.qualifications,
          experience: data.experience,
          notes: data.notes,
        }, { transaction: t });
      } else {
        // Create staff record for users missing one
        const lastStaff = await Staff.findOne({
          order: [['staffId', 'DESC']],
          attributes: ['staffId'],
          transaction: t,
        });

        const nextStaffId = lastStaff
          ? `SEF${(parseInt(lastStaff.staffId.replace('SEF', ''), 10) + 1)
              .toString()
              .padStart(4, '0')}`
          : 'SEF0001';

        staffRecord = await Staff.create({
          staffId: nextStaffId,
          userId,
          nicNumber: data.nicNumber,
          phoneNumber: data.phoneNumber || data.email,
          additionalPhone: data.additionalPhone,
          address: data.address,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          emergencyContact: data.emergencyContact,
          emergencyName: data.emergencyName,
          emergencyRelation: data.emergencyRelation,
          qualifications: data.qualifications,
          experience: data.experience,
          joiningDate: new Date(),
          notes: data.notes,
        }, { transaction: t });
      }

      return { user: user.toJSON(), staff: staffRecord.toJSON() };
    });

    return result;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError(400, 'Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await user.update({ password: hashedNewPassword });

    return { message: 'Password changed successfully' };
  }

  async exportUserData(userId: string) {
    const user = await User.findByPk(userId, {
      attributes: [
        'id', 'email', 'name', 'isActive', 'lastLogin',
        'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode', 'locationType'],
        },
        {
          model: Staff,
          as: 'staff',
          attributes: [
            'id', 'staffId', 'nicNumber', 'dateOfBirth', 'address',
            'phoneNumber', 'additionalPhone', 'emergencyContact',
            'emergencyName', 'emergencyRelation', 'qualifications',
            'experience', 'joiningDate', 'profileImage', 'notes',
            'createdAt', 'updatedAt'
          ],
        },
        {
          model: JobSheet,
          as: 'createdJobs',
          attributes: ['id', 'jobNumber', 'status', 'createdAt'],
          limit: 10,
          order: [['createdAt', 'DESC']],
          separate: true, // Use separate query to avoid limit issue
        },
        {
          model: JobSheet,
          as: 'assignedJobs',
          attributes: ['id', 'jobNumber', 'status', 'createdAt'],
          limit: 10,
          order: [['createdAt', 'DESC']],
          separate: true,
        },
        {
          model: Sale,
          as: 'sales',
          attributes: ['id', 'saleNumber', 'totalAmount', 'createdAt'],
          limit: 10,
          order: [['createdAt', 'DESC']],
          separate: true,
        },
        {
          model: ActivityLog,
          as: 'activityLogs',
          attributes: ['id', 'action', 'details', 'createdAt'],
          limit: 20,
          order: [['createdAt', 'DESC']],
          separate: true,
        },
      ],
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return {
      user: user.toJSON(),
      exportDate: new Date().toISOString(),
      dataTypes: [
        'Profile Information',
        'Staff Details',
        'Recent Job Sheets Created',
        'Recent Job Sheets Assigned',
        'Recent Sales',
        'Recent Activity Logs',
      ],
    };
  }
}

