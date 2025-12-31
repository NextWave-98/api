import { AppError } from '../../shared/utils/app-error';
import { CreateStaffDTO, UpdateStaffDTO } from './staff.dto';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary, deleteFromCloudinary, updateImageInCloudinary } from '../../shared/config/cloudinary';
import { UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';
import { User, Role, Location, Staff } from '../../models';
import { Op } from 'sequelize';
import  sequelize  from '../../shared/config/database';

export class StaffService {
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

  async getStaffDashboard(userId?: string, locationId?: string) {
    // Build where conditions for User
    const userWhere = {
      ...(locationId && { locationId }),
    };

    // Include for counts (minimal attributes)
    const countInclude = {
      model: User,
      as: 'user',
      where: userWhere,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: [],
          where: {
            name: {
              [Op.in]: ['STAFF', 'MANAGER', 'ADMIN'],
            },
          },
        },
        {
          model: Location,
          as: 'location',
          attributes: [],
        },
      ],
    };

    // Include for recent staff (full attributes)
    const recentInclude = {
      model: User,
      as: 'user',
      where: userWhere,
      attributes: ['id', 'email', 'name', 'isActive', 'createdAt'],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name'],
          where: {
            name: {
              [Op.in]: ['STAFF', 'MANAGER', 'ADMIN'],
            },
          },
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode'],
        },
      ],
    };

    const [totalStaff, activeStaff, recentStaff] = await Promise.all([
      Staff.count({ include: [countInclude] }),
      Staff.count({
        include: [
          {
            ...countInclude,
            where: {
              ...userWhere,
              isActive: true,
            },
          },
        ],
      }),
      Staff.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [recentInclude],
      }),
    ]);

    return {
      stats: {
        totalStaff,
        activeStaff,
        inactiveStaff: totalStaff - activeStaff,
      },
      recentStaff: recentStaff.map(s => s.toJSON()),
    };
  }

  async getStaffList(page = 1, limit = 10, locationId?: string) {
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      '$role.name$': {
        [Op.in]: ['STAFF', 'MANAGER', 'ADMIN'],
      },
    };

    if (locationId) {
      where.locationId = locationId;
    }

    const { count: total, rows: staff } = await User.findAndCountAll({
      offset,
      limit,
      where,
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
          attributes: ['id', 'name', 'locationCode'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return {
      staff: staff.map(s => s.toJSON()),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStaffById(id: string, requestingUserLocationId?: string) {
    const staff = await User.findByPk(id, {
      attributes: ['id', 'email', 'name', 'isActive', 'lastLogin', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode', 'address', 'phone', 'email'],
        },
      ],
    });

    if (!staff) {
      throw new AppError(404, 'Staff member not found');
    }

    const staffData = staff.toJSON();

    // Check if staff belongs to STAFF, MANAGER, or ADMIN role
    if (!['STAFF', 'MANAGER', 'ADMIN'].includes(staffData.role.name)) {
      throw new AppError(400, 'User is not a staff member');
    }

    // If requesting user is not admin, check location access
    if (requestingUserLocationId && staffData.location?.id !== requestingUserLocationId) {
      throw new AppError(403, 'Access denied. Staff member belongs to different location');
    }

    return staffData;
  }

  async getMyLocationInfo(userId: string) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'name'],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode', 'address', 'phone', 'email', 'isActive'],
        },
      ],
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const userData = user.toJSON();

    if (userData.role.name === 'ADMIN') {
      return {
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        },
        location: null,
        message: 'Admin has access to all locations',
      };
    }

    if (!userData.location) {
      throw new AppError(404, 'User is not assigned to any location');
    }

    return {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
      location: userData.location,
    };
  }

  // Create new staff member
  async createStaff(data: CreateStaffDTO, requestingUserLocationId?: string) {
    // Check if email already exists
    const existingUser = await User.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(400, 'Email already exists');
    }

    // Check if NIC already exists
    const existingNIC = await Staff.findOne({
      where: { nicNumber: data.nicNumber },
    });

    if (existingNIC) {
      throw new AppError(400, 'NIC number already exists');
    }

    // Verify role exists and is STAFF, MANAGER, or ADMIN
    const role = await Role.findByPk(data.roleId);

    if (!role) {
      throw new AppError(404, 'Role not found');
    }

    if (!['STAFF', 'MANAGER', 'ADMIN'].includes(role.name)) {
      throw new AppError(400, 'Can only create staff members with STAFF, MANAGER, or ADMIN role');
    }

    // Verify location exists if provided
    if (data.locationId) {
      const location = await Location.findByPk(data.locationId);

      if (!location) {
        throw new AppError(404, 'Location not found');
      }

      // If requesting user is not admin, ensure they can only create staff for their location
      if (requestingUserLocationId && data.locationId !== requestingUserLocationId) {
        throw new AppError(403, 'You can only create staff for your own location');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Generate next staff ID
    const staffId = await this.generateStaffId();

    // Create user and staff in a transaction
    let result: { user: User; staff: Staff };
    try {
      result = await sequelize.transaction(async (t) => {
        const user = await User.create({
          email: data.email,
          name: data.name,
          password: hashedPassword,
          roleId: data.roleId,
          locationId: data.locationId,
        }, { transaction: t });

        const staff = await Staff.create({
          staffId,
          userId: user.id,
          nicNumber: data.nicNumber,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          address: data.address,
          phoneNumber: data.phoneNumber,
          additionalPhone: data.additionalPhone,
          emergencyContact: data.emergencyContact,
          emergencyName: data.emergencyName,
          emergencyRelation: data.emergencyRelation,
          qualifications: data.qualifications,
          experience: data.experience,
          joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
          notes: data.notes,
        }, { transaction: t });

        return { user, staff };
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const fields = Object.keys(error.fields || {});
        if (fields.includes('phoneNumber')) {
          throw new AppError(400, 'Phone number already exists');
        }
        throw new AppError(400, 'Duplicate entry');
      }
      throw error;
    }

    // Fetch complete staff data
    return this.getStaffDetailsById(result.user.id, requestingUserLocationId);
  }

  // Get detailed staff information by user ID
  async getStaffDetailsById(userId: string, requestingUserLocationId?: string) {
    const staff = await Staff.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name', 'isActive', 'lastLogin', 'createdAt', 'updatedAt'],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name', 'description'],
            },
            {
              model: Location,
              as: 'location',
              attributes: ['id', 'name', 'locationCode', 'address', 'phone', 'email'],
            },
          ],
        },
      ],
    });

    if (!staff) {
      throw new AppError(404, 'Staff member not found');
    }

    const staffData = staff.toJSON();

    // If requesting user is not admin, check location access
    if (requestingUserLocationId && staffData.user.location?.id !== requestingUserLocationId) {
      throw new AppError(403, 'Access denied. Staff member belongs to different location');
    }

    return staffData;
  }

  // Update staff member
  async updateStaff(userId: string, data: UpdateStaffDTO, requestingUserLocationId?: string) {
    // Check if staff exists
    const existingStaff = await Staff.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['locationId'],
        },
      ],
    });

    if (!existingStaff) {
      throw new AppError(404, 'Staff member not found');
    }

    const staffData = existingStaff.toJSON() as any;

    // If requesting user is not admin, check location access
    if (requestingUserLocationId && staffData.user.locationId !== requestingUserLocationId) {
      throw new AppError(403, 'Access denied. Staff member belongs to different location');
    }

    // Check for duplicate email if email is being updated
    if (data.email) {
      const existingUser = await User.findOne({
        where: {
          email: data.email,
          id: { [Op.ne]: userId },
        },
      });

      if (existingUser) {
        throw new AppError(400, 'Email already exists');
      }
    }

    // Check for duplicate NIC if NIC is being updated
    if (data.nicNumber) {
      const existingNIC = await Staff.findOne({
        where: {
          nicNumber: data.nicNumber,
          userId: { [Op.ne]: userId },
        },
      });

      if (existingNIC) {
        throw new AppError(400, 'NIC number already exists');
      }
    }

    // Verify role if being updated
    if (data.roleId) {
      const role = await Role.findByPk(data.roleId);

      if (!role) {
        throw new AppError(404, 'Role not found');
      }

      if (!['STAFF', 'MANAGER', 'ADMIN'].includes(role.name)) {
        throw new AppError(400, 'Can only assign STAFF, MANAGER, or ADMIN role');
      }
    }

    // Verify location if being updated
    if (data.locationId !== undefined) {
      if (data.locationId) {
        const location = await Location.findByPk(data.locationId);

        if (!location) {
          throw new AppError(404, 'Location not found');
        }

        // If requesting user is not admin, ensure they can only assign to their location
        if (requestingUserLocationId && data.locationId !== requestingUserLocationId) {
          throw new AppError(403, 'You can only assign staff to your own location');
        }
      }
    }

    // Prepare user update data
    const userUpdateData: any = {};
    if (data.email) userUpdateData.email = data.email;
    if (data.name) userUpdateData.name = data.name;
    if (data.password) userUpdateData.password = await bcrypt.hash(data.password, 10);
    if (data.roleId) userUpdateData.roleId = data.roleId;
    if (data.locationId !== undefined) userUpdateData.locationId = data.locationId;
    if (data.isActive !== undefined) userUpdateData.isActive = data.isActive;

    // Prepare staff update data
    const staffUpdateData: any = {};
    if (data.nicNumber) staffUpdateData.nicNumber = data.nicNumber;
    if (data.dateOfBirth !== undefined) {
      staffUpdateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }
    if (data.address !== undefined) staffUpdateData.address = data.address;
    if (data.phoneNumber !== undefined) staffUpdateData.phoneNumber = data.phoneNumber;
    if (data.additionalPhone !== undefined) staffUpdateData.additionalPhone = data.additionalPhone;
    if (data.emergencyContact !== undefined) staffUpdateData.emergencyContact = data.emergencyContact;
    if (data.emergencyName !== undefined) staffUpdateData.emergencyName = data.emergencyName;
    if (data.emergencyRelation !== undefined) staffUpdateData.emergencyRelation = data.emergencyRelation;
    if (data.qualifications !== undefined) staffUpdateData.qualifications = data.qualifications;
    if (data.experience !== undefined) staffUpdateData.experience = data.experience;
    if (data.joiningDate !== undefined) {
      staffUpdateData.joiningDate = data.joiningDate ? new Date(data.joiningDate) : null;
    }
    if (data.notes !== undefined) staffUpdateData.notes = data.notes;

    // Update user and staff in a transaction
    try {
      await sequelize.transaction(async (t) => {
        if (Object.keys(userUpdateData).length > 0) {
          await User.update(userUpdateData, {
            where: { id: userId },
            transaction: t,
          });
        }

        if (Object.keys(staffUpdateData).length > 0) {
          await Staff.update(staffUpdateData, {
            where: { userId },
            transaction: t,
          });
        }
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const fields = Object.keys((error as any).fields || {});
        if (fields.includes('phoneNumber')) {
          throw new AppError(400, 'Phone number already exists');
        }
        throw new AppError(400, 'Duplicate entry');
      }
      throw error;
    }

    return this.getStaffDetailsById(userId, requestingUserLocationId);
  }

  // Update staff profile image with Cloudinary
  async updateStaffImage(userId: string, imageBuffer: Buffer, requestingUserLocationId?: string) {
    const staff = await Staff.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['locationId'],
        },
      ],
    });

    if (!staff) {
      throw new AppError(404, 'Staff member not found');
    }

    const staffData = staff.toJSON() as any;

    // If requesting user is not admin, check location access
    if (requestingUserLocationId && staffData.user.locationId !== requestingUserLocationId) {
      throw new AppError(403, 'Access denied. Staff member belongs to different location');
    }

    // Upload to Cloudinary (delete old image if exists)
    const { url, publicId } = await updateImageInCloudinary(
      imageBuffer,
      staff.cloudinaryPublicId ?? null,
      'staff'
    );

    // Update database with new image URL and public ID
    await staff.update({
      profileImage: url,
      cloudinaryPublicId: publicId,
    });

    return this.getStaffDetailsById(userId, requestingUserLocationId);
  }

  // Delete staff member (soft delete by deactivating user, optionally delete image)
  async deleteStaff(userId: string, requestingUserLocationId?: string, deleteImage: boolean = false) {
    const staff = await Staff.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['locationId', 'isActive'],
        },
      ],
    });

    if (!staff) {
      throw new AppError(404, 'Staff member not found');
    }

    const staffData = staff.toJSON() as any;

    // If requesting user is not admin, check location access
    if (requestingUserLocationId && staffData.user.locationId !== requestingUserLocationId) {
      throw new AppError(403, 'Access denied. Staff member belongs to different location');
    }

    // Delete image from Cloudinary if requested
    if (deleteImage && staff.cloudinaryPublicId) {
      await deleteFromCloudinary(staff.cloudinaryPublicId);
    }

    // Soft delete by deactivating the user
    await User.update(
      { isActive: false },
      { where: { id: userId } }
    );

    return { message: 'Staff member deactivated successfully' };
  }

  // Get all staff with filters
  async getAllStaff(
    page = 1,
    limit = 10,
    requestingUserLocationId?: string,
    filters?: {
      search?: string;
      locationId?: string;
      roleId?: string;
      isActive?: boolean;
    }
  ) {
    const offset = (page - 1) * limit;

    // Build staff where clause
    let staffWhere: any;

    // Build role condition
    let roleCondition: any = { '$user.role.name$': { [Op.in]: ['STAFF', 'MANAGER', 'ADMIN'] } };
    if (filters?.roleId) {
      // Check if roleId is a role name or ID
      if (['STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(filters.roleId)) {
        roleCondition = { '$user.role.name$': filters.roleId };
      } else {
        roleCondition = { '$user.roleId$': filters.roleId };
      }
    }

    if (filters?.search) {
      // When searching, use AND with OR for search fields
      staffWhere = {
        [Op.and]: [
          {
            ...roleCondition,
            ...(requestingUserLocationId && { '$user.locationId$': requestingUserLocationId }),
            ...(filters?.locationId && { '$user.locationId$': filters.locationId }),
          },
          {
            [Op.or]: [
              { '$user.name$': { [Op.iLike]: `%${filters.search}%` } },
              { '$user.email$': { [Op.iLike]: `%${filters.search}%` } },
              { nicNumber: { [Op.iLike]: `%${filters.search}%` } },
            ],
          },
        ],
      };
    } else {
      // No search, just filter by user conditions
      staffWhere = {
        ...roleCondition,
        ...(requestingUserLocationId && { '$user.locationId$': requestingUserLocationId }),
        ...(filters?.locationId && { '$user.locationId$': filters.locationId }),
      };
    }

    // Build user where clause for isActive filter
    const userWhere: any = {};
    if (filters?.isActive !== undefined) {
      userWhere.isActive = filters.isActive;
    }

    try {
      const { count: total, rows: staff } = await Staff.findAndCountAll({
        offset,
        limit,
        where: staffWhere,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'name', 'isActive', 'lastLogin', 'createdAt'],
            where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
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
          },
        ],
        order: [['createdAt', 'DESC']],
        distinct: true,
      });

      return {
        staff: staff.map(s => s.toJSON()),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error in getAllStaff:', error);
      throw error;
    }
  }

  /**
   * Assign or reassign staff to a location
   */
  async assignStaffToLocation(userId: string, locationId: string | null, requestingUserLocationId?: string) {
    // Check if user exists
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode'],
        },
        {
          model: Staff,
          as: 'staff',
        },
      ],
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const userData = user.toJSON() as any;

    // Check if user has staff record
    if (!userData.staff) {
      throw new AppError(400, 'User is not a staff member');
    }

    // If locationId is provided, verify it exists
    if (locationId) {
      const location = await Location.findByPk(locationId);

      if (!location) {
        throw new AppError(404, 'Location not found');
      }

      // Check if location is active
      if (!location.isActive) {
        throw new AppError(400, 'Cannot assign to inactive location');
      }
    }

    // Store previous location info for activity log
    const previousLocation = userData.location;

    // Update user's location
    await user.update({ locationId });

    // Reload with updated relations
    await user.reload({
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode', 'address'],
        },
        {
          model: Staff,
          as: 'staff',
        },
      ],
    });

    const updatedUserData = user.toJSON() as any;

    return {
      success: true,
      message: locationId
        ? `Staff member assigned to ${updatedUserData.location?.name || 'location'} successfully`
        : 'Staff member unassigned from location successfully',
      user: {
        id: updatedUserData.id,
        email: updatedUserData.email,
        name: updatedUserData.name,
        role: updatedUserData.role,
        location: updatedUserData.location,
        previousLocation: previousLocation,
      },
    };
  }
}

