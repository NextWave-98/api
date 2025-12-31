import { Device, Customer, JobSheet, User, Location } from '../../models';
import { Op } from 'sequelize';
import { AppError } from '../../shared/utils/app-error';
import { withPrismaErrorHandling } from '../../shared/utils/sequelize-error-handler';
import { CreateDeviceDTO, UpdateDeviceDTO, DeviceQueryDTO } from './device.dto';

export class DeviceService {
  /**
   * Create a new device
   */
  async createDevice(data: CreateDeviceDTO) {
    // Verify customer exists
    const customer = await Customer.findByPk(data.customerId);

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    // Check serial number uniqueness if provided
    if (data.serialNumber) {
      const existingSerial = await Device.findOne({
        where: { serialNumber: data.serialNumber },
      });

      if (existingSerial) {
        throw new AppError(400, 'Device with this serial number already exists');
      }
    }

    // Check IMEI uniqueness if provided
    if (data.imei) {
      const existingImei = await Device.findOne({
        where: { imei: data.imei },
      });

      if (existingImei) {
        throw new AppError(400, 'Device with this IMEI already exists');
      }
    }

    const device = await Device.create({
      ...data,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
    });

    await device.reload({
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name', 'phone', 'email'],
        },
      ],
    });

    return device;
  }

  /**
   * Get all devices with pagination and filters
   */
  async getDevices(query: DeviceQueryDTO) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where[Op.or] = [
        { brand: { [Op.iLike]: `%${query.search}%` } },
        { model: { [Op.iLike]: `%${query.search}%` } },
        { serialNumber: { [Op.iLike]: `%${query.search}%` } },
        { imei: { [Op.like]: `%${query.search}%` } },
      ];
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.deviceType) {
      where.deviceType = query.deviceType;
    }

    if (query.brand) {
      where.brand = { [Op.iLike]: `%${query.brand}%` };
    }

    const { count: total, rows: devices } = await Device.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name', 'phone', 'email', 'customer_type'],
        },
      ],
    });

    // Get job sheet counts separately
    const devicesWithCounts = await Promise.all(
      devices.map(async (device) => {
        const jobSheetCount = await JobSheet.count({ where: { deviceId: device.id } });
        return {
          ...device.toJSON(),
          _count: { jobSheets: jobSheetCount },
        };
      })
    );

    return {
      devices: devicesWithCounts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get device by ID
   */
  async getDeviceById(id: string) {
    const device = await Device.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name', 'phone', 'alternate_phone', 'email', 'customer_type', 'address', 'city'],
        },
        {
          model: JobSheet,
          as: 'jobSheets',
          include: [
            {
              model: User,
              as: 'assignedTo',
              attributes: ['id', 'name', 'email'],
            },
            {
              model: Location,
              as: 'location',
              attributes: ['id', 'name', 'address'],
            },
          ],
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!device) {
      throw new AppError(404, 'Device not found');
    }

    const deviceData = device.toJSON();
    const jobSheetCount = Array.isArray(deviceData.jobSheets) ? deviceData.jobSheets.length : 0;

    return {
      ...deviceData,
      _count: { jobSheets: jobSheetCount },
    };
  }

  /**
   * Get devices by customer ID
   */
  async getDevicesByCustomerId(customerId: string) {
    const devices = await Device.findAll({
      where: { customerId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: JobSheet,
          as: 'jobSheets',
          where: {
            status: {
              [Op.notIn]: ['COMPLETED', 'READY_DELIVERY', 'DELIVERED', 'CANCELLED'],
            },
          },
          attributes: ['id', 'job_number', 'status'],
          limit: 1,
          required: false,
        },
      ],
    });

    // Add isAvailable flag and counts to each device
    const devicesWithAvailability = await Promise.all(
      devices.map(async (device) => {
        const deviceData = device.toJSON();
        const jobSheetCount = await JobSheet.count({ where: { deviceId: device.id } });
        const activeJobs = Array.isArray(deviceData.jobSheets) ? deviceData.jobSheets : [];

        return {
          ...deviceData,
          _count: { jobSheets: jobSheetCount },
          isAvailable: activeJobs.length === 0,
          activeJob: activeJobs.length > 0 ? activeJobs[0] : null,
        };
      })
    );

    return devicesWithAvailability;
  }

  /**
   * Update device
   */
  async updateDevice(id: string, data: UpdateDeviceDTO) {
    const existingDevice = await Device.findByPk(id);

    if (!existingDevice) {
      throw new AppError(404, 'Device not found');
    }

    // Check serial number uniqueness if updating
    if (data.serialNumber && data.serialNumber !== existingDevice.serialNumber) {
      const serialExists = await Device.findOne({
        where: { serialNumber: data.serialNumber, id: { [Op.ne]: id } },
      });

      if (serialExists) {
        throw new AppError(400, 'Serial number already in use');
      }
    }

    // Check IMEI uniqueness if updating
    if (data.imei && data.imei !== existingDevice.imei) {
      const imeiExists = await Device.findOne({
        where: { imei: data.imei, id: { [Op.ne]: id } },
      });

      if (imeiExists) {
        throw new AppError(400, 'IMEI already in use');
      }
    }

    const updateData: any = { ...data };
    if (data.purchaseDate) {
      updateData.purchaseDate = new Date(data.purchaseDate);
    }
    if (data.warrantyExpiry) {
      updateData.warrantyExpiry = new Date(data.warrantyExpiry);
    }

    await Device.update(updateData, { where: { id } });

    const device = await Device.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name', 'phone', 'email'],
        },
      ],
    });

    return device;
  }

  /**
   * Delete device
   */
  async deleteDevice(id: string) {
    const device = await Device.findByPk(id);

    if (!device) {
      throw new AppError(404, 'Device not found');
    }

    // Check if device has active job sheets
    const activeJobSheets = await JobSheet.count({
      where: {
        deviceId: id,
        status: {
          [Op.notIn]: ['DELIVERED', 'CANCELLED'],
        },
      },
    });

    if (activeJobSheets > 0) {
      throw new AppError(
        400,
        'Cannot delete device with active job sheets. Please complete or cancel all job sheets first.'
      );
    }

    await Device.destroy({ where: { id } });

    return { message: 'Device deleted successfully' };
  }

  /**
   * Get device statistics
   */
  async getDeviceStats() {
    const total = await Device.count();
    const byType = await Device.findAll({
      attributes: [
        'device_type',
        [Device.sequelize!.fn('COUNT', Device.sequelize!.col('id')), 'count'],
      ],
      group: ['device_type'],
      raw: true,
    });

    const typeStats = (byType as any[]).reduce((acc: any, item) => {
      acc[item.device_type] = parseInt(item.count, 10);
      return acc;
    }, {});

    return {
      total,
      byType: typeStats,
    };
  }

  /**
   * Check warranty status
   */
  async checkWarranty(id: string) {
    const device = await Device.findByPk(id, {
      attributes: ['id', 'brand', 'model', 'serial_number', 'warranty_expiry'],
    });

    if (!device) {
      throw new AppError(404, 'Device not found');
    }

    const now = new Date();
    const isUnderWarranty = device.warrantyExpiry ? device.warrantyExpiry > now : false;

    return {
      ...device.toJSON(),
      isUnderWarranty,
      warrantyStatus: isUnderWarranty ? 'ACTIVE' : 'EXPIRED',
    };
  }

  /**
   * Search devices by IMEI or Serial Number
   */
  async searchDevices(searchTerm: string, limit: number = 10) {
    const devices = await Device.findAll({
      where: {
        [Op.or]: [
          { serialNumber: { [Op.iLike]: `%${searchTerm}%` } },
          { imei: { [Op.like]: `%${searchTerm}%` } },
          { brand: { [Op.iLike]: `%${searchTerm}%` } },
          { model: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      limit,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name', 'phone'],
        },
      ],
    });

    return devices.map(d => d.toJSON());
  }
}

