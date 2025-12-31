import { AppError } from '../../shared/utils/app-error';
import { Location, User, Role, Warehouse, ProductInventory, JobSheet, Sale } from '../../models';
import { Op } from 'sequelize';
import { LocationType } from '../../enums';
import sequelize from '../../config/database';

export class LocationService {
  // Generate location code based on type:
  // Warehouse: WH-0001, WH-0002, etc.
  // Branch: BR-0001, BR-0002, etc.
  // Store: ST-0001, ST-0002, etc.
  // Outlet: OT-0001, OT-0002, etc.
  private async generateLocationCode(locationType: LocationType): Promise<string> {
    const prefixes = {
      WAREHOUSE: 'WH',
      BRANCH: 'BR',
      STORE: 'ST',
      OUTLET: 'OT',
    };

    const prefix = prefixes[locationType];
    
    // Find the highest sequence number for this prefix
    const existingLocations = await Location.findAll({
      where: {
        locationCode: {
          [Op.startsWith]: prefix,
        },
      },
      attributes: ['locationCode'],
      order: [['locationCode', 'DESC']],
    });

    let sequenceNumber = 1;
    
    if (existingLocations.length > 0) {
      // Extract the number part from the most recent code
      const latestCode = existingLocations[0].locationCode;
      const numberPart = latestCode.substring(prefix.length + 1); // Skip prefix and hyphen
      const lastNumber = parseInt(numberPart, 10);
      
      if (!isNaN(lastNumber)) {
        sequenceNumber = lastNumber + 1;
      }
    }

    // Try to find an available code (in case of gaps in sequence)
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      const paddedNumber = sequenceNumber.toString().padStart(4, '0');
      const code = `${prefix}-${paddedNumber}`;
      
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
    
    throw new AppError(500, 'Unable to generate unique location code');
  }

  async createLocation(data: {
    name: string;
    locationType?: LocationType;
    locationCode?: string;
    address?: string;
    city?: string;
    phone?: string;
    phone2?: string;
    phone3?: string;
    email?: string;
    isMainWarehouse?: boolean;
    warehouseCapacity?: number;
    branchCode?: string;
  }) {
    // Check if location with same name exists
    const existing = await Location.findOne({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError(400, 'Location with this name already exists');
    }

    // Generate code if not provided
    let locationCode = data.locationCode;
    if (!locationCode) {
      locationCode = await this.generateLocationCode(data.locationType || LocationType.BRANCH);
    } else {
      locationCode = locationCode.toUpperCase();
      
      // Check if custom code already exists
      const codeExists = await Location.findOne({
        where: { locationCode },
      });
      
      if (codeExists) {
        throw new AppError(400, 'Location with this code already exists');
      }
    }

    // Validate warehouse-specific fields
    // Validation for warehouse/branch specific logic will be handled
    // by the respective Warehouse/Branch creation logic

    const location = await Location.create({
      name: data.name,
      locationCode,
      locationType: data.locationType || 'BRANCH',
      address: data.address,
      city: data.city,
      phone: data.phone,
      phone2: data.phone2,
      phone3: data.phone3,
      email: data.email,
    });

    await location.reload();

    // Get counts separately
    const userCount = await User.count({ where: { locationId: location.id } });
    const inventoryCount = await ProductInventory.count({ where: { locationId: location.id } });

    const locationData = location.toJSON();
    return {
      ...locationData,
      _count: {
        users: userCount,
        productInventory: inventoryCount,
      },
    };
  }

  async getAllLocations(page = 1, limit = 10, isActive?: boolean, locationType?: LocationType, warehouseOr?: boolean) {
    const offset = (page - 1) * limit;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (locationType) where.locationType = locationType;
    
    // Handle warehouseOr filtering
    if (warehouseOr === true) {
      where.locationType = 'WAREHOUSE';
    } else if (warehouseOr === false) {
      where.locationType = 'BRANCH';
    }

    const { count: total, rows: locations } = await Location.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'email', 'name', 'isActive', 'lastLogin', 'createdAt'],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name', 'description'],
            },
          ],
          separate: true,
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    // Add counts to each location
    const locationsWithCounts = await Promise.all(
      locations.map(async (location) => {
        const inventoryCount = await ProductInventory.count({ where: { locationId: location.id } });
        const jobSheetCount = await JobSheet.count({ where: { locationId: location.id } });
        const saleCount = await Sale.count({ where: { locationId: location.id } });

        const locationData = location.toJSON();
        return {
          ...locationData,
          _count: {
            productInventory: inventoryCount,
            jobSheets: jobSheetCount,
            sales: saleCount,
          },
        };
      })
    );

    return {
      locations: locationsWithCounts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLocationsByType(locationType: LocationType, page = 1, limit = 10, isActive?: boolean) {
    return this.getAllLocations(page, limit, isActive, locationType);
  }

  async getWarehouses(page = 1, limit = 10, isActive?: boolean) {
    return this.getLocationsByType(LocationType.WAREHOUSE, page, limit, isActive);
  }

  async getBranches(page = 1, limit = 10, isActive?: boolean) {
    return this.getLocationsByType(LocationType.BRANCH, page, limit, isActive);
  }

  async getMainWarehouse() {
    const mainWarehouse = await Warehouse.findOne({
      where: {
        isMainWarehouse: true,
      },
      include: [
        {
          model: Location,
          as: 'location',
        },
      ],
    });

    if (!mainWarehouse || !mainWarehouse.location) {
      throw new AppError(404, 'Main warehouse not found');
    }

    if (!mainWarehouse.location.isActive) {
      throw new AppError(404, 'Main warehouse is not active');
    }

    // Get counts separately
    const userCount = await User.count({ where: { locationId: mainWarehouse.location.id } });
    const inventoryCount = await ProductInventory.count({ where: { locationId: mainWarehouse.location.id } });

    const locationData = mainWarehouse.location.toJSON();

    // Flatten the response to maintain API compatibility
    return {
      ...locationData,
      _count: {
        users: userCount,
        productInventory: inventoryCount,
      },
      warehouseType: mainWarehouse.warehouseType,
      storageCapacity: mainWarehouse.storageCapacity,
      isMainWarehouse: mainWarehouse.isMainWarehouse,
    };
  }

  async getLocationById(id: string) {
    const location = await Location.findByPk(id, {
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

    if (!location) {
      throw new AppError(404, 'Location not found');
    }

    // Get counts separately
    const userCount = await User.count({ where: { locationId: id } });
    const inventoryCount = await ProductInventory.count({ where: { locationId: id } });
    const jobSheetCount = await JobSheet.count({ where: { locationId: id } });
    const saleCount = await Sale.count({ where: { locationId: id } });

    const locationData = location.toJSON();
    return {
      ...locationData,
      _count: {
        users: userCount,
        productInventory: inventoryCount,
        jobSheets: jobSheetCount,
        sales: saleCount,
      },
    };
  }

  async updateLocation(
    id: string,
    data: {
      name?: string;
      locationType?: LocationType;
      locationCode?: string;
      address?: string;
      city?: string;
      phone?: string;
      phone2?: string;
      phone3?: string;
      email?: string;
      isMainWarehouse?: boolean;
      warehouseCapacity?: number | null;
      branchCode?: string | null;
      isActive?: boolean;
    }
  ) {
    const existing = await Location.findByPk(id);

    if (!existing) {
      throw new AppError(404, 'Location not found');
    }

    // Check for duplicate name or code if being updated
    if (data.name || data.locationCode) {
      const orConditions = [];
      if (data.name) orConditions.push({ name: data.name });
      if (data.locationCode) orConditions.push({ locationCode: data.locationCode });

      const duplicate = await Location.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: id } },
            { [Op.or]: orConditions },
          ],
        },
      });

      if (duplicate) {
        throw new AppError(400, 'Location with this name or code already exists');
      }
    }

    // Main warehouse validation will be handled at Warehouse model level
    // Warehouse-specific fields are now handled by the Warehouse model separately

    const updateData: any = { ...data };
    if (data.locationCode) {
      updateData.locationCode = data.locationCode.toUpperCase();
    }

    await Location.update(updateData, { where: { id } });

    const location = await Location.findByPk(id);

    // Get counts separately
    const userCount = await User.count({ where: { locationId: id } });
    const inventoryCount = await ProductInventory.count({ where: { locationId: id } });

    const locationData = location!.toJSON();
    return {
      ...locationData,
      _count: {
        users: userCount,
        productInventory: inventoryCount,
      },
    };
  }

  async deleteLocation(id: string) {
    const existing = await Location.findByPk(id);

    if (!existing) {
      throw new AppError(404, 'Location not found');
    }

    // Get counts
    const userCount = await User.count({ where: { locationId: id } });
    const inventoryCount = await ProductInventory.count({ where: { locationId: id } });
    const jobSheetCount = await JobSheet.count({ where: { locationId: id } });
    const saleCount = await Sale.count({ where: { locationId: id } });

    // Check if location has related data
    const hasRelatedData = 
      userCount > 0 ||
      inventoryCount > 0 ||
      jobSheetCount > 0 ||
      saleCount > 0;

    if (hasRelatedData) {
      throw new AppError(
        400,
        `Cannot delete location with existing data. Users: ${userCount}, Inventory: ${inventoryCount}, Job Sheets: ${jobSheetCount}, Sales: ${saleCount}`
      );
    }

    await Location.destroy({ where: { id } });

    return { message: 'Location deleted successfully' };
  }

  async assignUserToLocation(userId: string, locationId: string) {
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

    // Admin can access all locations, so don't assign them to specific locations
    if (user.role && user.role.name === 'ADMIN') {
      throw new AppError(400, 'Admin users have access to all locations and cannot be assigned to a specific location');
    }

    // Verify location exists
    const location = await Location.findByPk(locationId);

    if (!location) {
      throw new AppError(404, 'Location not found');
    }

    if (!location.isActive) {
      throw new AppError(400, 'Cannot assign user to inactive location');
    }

    // Assign user to location
    await User.update({ locationId }, { where: { id: userId } });

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
          attributes: ['id', 'name', 'locationCode', 'locationType'],
        },
      ],
    });

    const userObj = updatedUser!.toJSON() as any;
    const { password, refreshToken, ...userWithoutSensitive } = userObj;

    return userWithoutSensitive;
  }

  async unassignUserFromLocation(userId: string) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!user.locationId) {
      throw new AppError(400, 'User is not assigned to any location');
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

    const userObj = updatedUser!.toJSON() as any;
    const { password, refreshToken, ...userWithoutSensitive } = userObj;

    return userWithoutSensitive;
  }

  async getLocationUsers(locationId: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const location = await Location.findByPk(locationId);

    if (!location) {
      throw new AppError(404, 'Location not found');
    }

    const { count: total, rows: users } = await User.findAndCountAll({
      where: { locationId },
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
      location: {
        id: location.id,
        name: location.name,
        locationCode: location.locationCode,
        locationType: location.locationType,
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

  async getLocationStats(locationId: string) {
    const location = await Location.findByPk(locationId);

    if (!location) {
      throw new AppError(404, 'Location not found');
    }

    const [
      totalUsers, 
      activeUsers, 
      usersByRole,
      totalInventoryItems,
      lowStockItems,
      totalJobSheets,
      totalSales,
    ] = await Promise.all([
      User.count({ where: { locationId } }),
      User.count({ where: { locationId, isActive: true } }),
      User.findAll({
        where: { locationId },
        attributes: [
          'roleId',
          [sequelize.fn('COUNT', sequelize.col('User.id')), 'count'],
        ],
        group: ['roleId'],
        raw: true,
      }),
      ProductInventory.count({ where: { locationId } }),
      ProductInventory.count({ 
        where: { 
          locationId,
          [Op.or]: [
            sequelize.where(
              sequelize.col('quantity'),
              Op.lt,
              sequelize.fn('COALESCE', sequelize.col('minStockLevel'), 5)
            ),
          ],
        } 
      }),
      JobSheet.count({ where: { locationId } }),
      Sale.count({ where: { locationId } }),
    ]);

    const roleIds = (usersByRole as any[]).map((r) => r.roleId);
    const roles = await Role.findAll({
      where: {
        id: {
          [Op.in]: roleIds,
        },
      },
      attributes: ['id', 'name'],
    });

    const roleStats = (usersByRole as any[]).map((stat) => ({
      role: roles.find((r) => r.id === stat.roleId)?.name || 'Unknown',
      count: parseInt(stat.count, 10),
    }));

    return {
      location: {
        id: location.id,
        name: location.name,
        locationCode: location.locationCode,
        locationType: location.locationType,
      },
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          byRole: roleStats,
        },
        inventory: {
          totalItems: totalInventoryItems,
          lowStock: lowStockItems,
        },
        operations: {
          jobSheets: totalJobSheets,
          sales: totalSales,
        },
      },
    };
  }

  async getLocationInventory(locationId: string, page = 1, limit = 10, lowStock = false) {
    const location = await Location.findByPk(locationId);

    if (!location) {
      throw new AppError(404, 'Location not found');
    }

    const offset = (page - 1) * limit;
    const where: any = { locationId };

    if (lowStock) {
      // Get items where quantity is less than minStockLevel
      where[Op.or] = [
        sequelize.where(
          sequelize.col('quantity'),
          Op.lt,
          sequelize.fn('COALESCE', sequelize.col('minStockLevel'), 5)
        ),
      ];
    }

    const { count: total, rows: inventory } = await ProductInventory.findAndCountAll({
      where,
      offset,
      limit,
      include: [
        {
          model: require('../../models').Product,
          as: 'product',
          attributes: ['id', 'productCode', 'name', 'sku', 'unitPrice', 'costPrice'],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    return {
      location: {
        id: location.id,
        name: location.name,
        locationCode: location.locationCode,
        locationType: location.locationType,
      },
      inventory: inventory.map(i => i.toJSON()),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

