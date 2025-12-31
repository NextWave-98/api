import { Customer, Location, Device, JobSheet, Payment, Sale, Notification } from '../../models';
import { AppError } from '../../shared/utils/app-error';
import { CreateCustomerDTO, UpdateCustomerDTO, CustomerQueryDTO } from './customer.dto';
import { Sequelize, Op, fn, col, literal } from 'sequelize';
// import { sequelize } from '../../config/database';

export class CustomerService {
  /**
   * Generate next customer ID in format CUS0001, CUS0002, etc.
   */
  private async generateCustomerId(): Promise<string> {
    const lastCustomer = await Customer.findOne({
      order: [['customer_id', 'DESC']],
      attributes: ['customerId'],
    });

    if (!lastCustomer) {
      return 'CUS0001';
    }

    const lastNumber = parseInt(lastCustomer.customerId.replace('CUS', ''), 10);
    const nextNumber = lastNumber + 1;
    return `CUS${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerDTO) {
    // Check if phone already exists
    const existingPhone = await Customer.findOne({
      where: { phone: data.phone },
    });

    if (existingPhone) {
      throw new AppError(400, 'Customer with this phone number already exists');
    }

    // Check if NIC already exists (if provided)
    if (data.nicNumber) {
      const existingNic = await Customer.findOne({
        where: { nicNumber: data.nicNumber },
      });

      if (existingNic) {
        throw new AppError(400, 'Customer with this NIC number already exists');
      }
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingEmail = await Customer.findOne({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new AppError(400, 'Customer with this email already exists');
      }
    }

    const customerId = await this.generateCustomerId();

    const customer = await Customer.create({
      customerId,
      ...data,
    });

    // Reload with location
    await customer.reload({
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address'],
        },
      ],
    });

    return customer.toJSON();
  }

  /**
   * Get all customers with pagination and filters
   */
  async getCustomers(query: CustomerQueryDTO) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      // Build phone variants to match common stored formats
      const searchVal = query.search;
      const phoneVariants: string[] = [searchVal];

      // If search looks like it starts with 0 (e.g. 078...), also try variant without leading 0
      if (/^0\d+/.test(searchVal)) {
        const withoutZero = searchVal.replace(/^0/, '');
        phoneVariants.push(withoutZero);
        phoneVariants.push(`+94${withoutZero}`);
        phoneVariants.push(`94${withoutZero}`);
      }

      // If search starts with +94 or 94, also add variant with leading 0
      if (/^(?:\+94|94)\d+/.test(searchVal)) {
        const withoutCode = searchVal.replace(/^\+?94/, '');
        phoneVariants.push(`0${withoutCode}`);
      }

      // Remove duplicates
      const uniquePhones = Array.from(new Set(phoneVariants));

      // Build OR conditions
      const orConditions: any[] = [
        Sequelize.where(Sequelize.cast(Sequelize.col('Customer.customer_id'), 'TEXT'), Op.iLike, `%${searchVal}%`),
        { name: { [Op.iLike]: `%${searchVal}%` } },
        { email: { [Op.iLike]: `%${searchVal}%` } },
        { nicNumber: { [Op.like]: `%${searchVal}%` } },
      ];

      // Add phone contains conditions for each variant
      uniquePhones.forEach((p) => {
        orConditions.push({ phone: { [Op.like]: `%${p}%` } });
      });

      where[Op.or] = orConditions;
    }

    if (query.customerType) {
      where.customerType = query.customerType;
    }

    if (query.locationId) {
      where.locationId = query.locationId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    const { count, rows: customers } = await Customer.findAndCountAll({
      where,
      offset,
      limit,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address'],
        },
      ],
      attributes: [
        'id',
        'customerId',
        'name',
        'email',
        'phone',
        'alternatePhone',
        'address',
        'city',
        'nicNumber',
        'locationId',
        'customerType',
        'loyaltyPoints',
        'notes',
        'isActive',
        'createdAt',
        'updatedAt',
        [literal('(SELECT COUNT(*) FROM "devices" WHERE "devices"."customer_id" = "Customer"."id")'), 'deviceCount'],
        [literal('(SELECT COUNT(*) FROM "job_sheets" WHERE "job_sheets"."customer_id" = "Customer"."id")'), 'jobSheetCount'],
        [literal('(SELECT COUNT(*) FROM "payments" WHERE "payments"."customer_id" = "Customer"."id")'), 'paymentCount'],
      ],
      distinct: true,
      subQuery: false,
    });

    // Get total sales and count for each customer
    const customerIds = customers.map(c => c.id);
    let salesData: { customerId: string; totalSales: number; totalPurchases: number }[] = [];
    
    if (customerIds.length > 0) {
      const data = await Sale.findAll({
        where: {
          customerId: {
            [Op.in]: customerIds,
          },
        },
        attributes: [
          'customer_id',
          [fn('SUM', col('total_amount')), 'totalSales'],
          [fn('COUNT', col('id')), 'totalPurchases'],
        ],
        group: ['customer_id'],
        raw: true,
      }) as any[];

      salesData = data.map(d => ({
        customerId: d.customer_id,
        totalSales: Number(d.totalSales) || 0,
        totalPurchases: Number(d.totalPurchases) || 0,
      }));
    }

    // Add sales data to customers
    const customersWithSales = customers.map(customer => {
      const customerData = customer.toJSON();
      const data = salesData.find(d => d.customerId === customer.id);
      return {
        ...customerData,
        totalSales: data ? data.totalSales : 0,
        totalPurchases: data ? data.totalPurchases : 0,
      };
    });

    // Debug log to help troubleshooting search queries (can be removed later)
    try {
      console.log('[CustomerService.getCustomers] where filter:', JSON.stringify(where));
    } catch (err) {
      // ignore
    }

    return {
      customers: customersWithSales,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string) {
    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address', 'phone'],
        },
        {
          model: Device,
          as: 'devices',
          include: [
            {
              model: JobSheet,
              as: 'jobSheets',
              attributes: [],
            },
          ],
        },
        {
          model: JobSheet,
          as: 'jobSheets',
          limit: 10,
          order: [['created_at', 'DESC']],
          separate: true,
          include: [
            {
              model: Device,
              as: 'device',
              attributes: ['device_type', 'brand', 'model'],
            },
          ],
        },
        {
          model: Payment,
          as: 'payments',
          limit: 10,
          order: [['payment_date', 'DESC']],
          separate: true,
        },
        {
          model: Notification,
          as: 'notifications',
          limit: 10,
          order: [['created_at', 'DESC']],
          separate: true,
        },
      ],
      attributes: {
        include: [
          [literal('(SELECT COUNT(*) FROM "devices" WHERE "devices"."customer_id" = "Customer"."id")'), 'deviceCount'],
          [literal('(SELECT COUNT(*) FROM "job_sheets" WHERE "job_sheets"."customer_id" = "Customer"."id")'), 'jobSheetCount'],
          [literal('(SELECT COUNT(*) FROM "payments" WHERE "payments"."customer_id" = "Customer"."id")'), 'paymentCount'],
          [literal('(SELECT COUNT(*) FROM "notifications" WHERE "notifications"."customer_id" = "Customer"."id")'), 'notificationCount'],
        ],
      },
    });

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    return customer.toJSON();
  }

  /**
   * Get customer by customerId
   */
  async getCustomerByCustomerId(customerId: string) {
    const customer = await Customer.findOne({
      where: { customerId },
      include: [
        {
          model: Location,
          as: 'location',
        },
        {
          model: Device,
          as: 'devices',
        },
      ],
      attributes: {
        include: [
          [fn('COUNT', col('jobSheets.id')), 'jobSheetCount'],
          [fn('COUNT', col('payments.id')), 'paymentCount'],
        ],
      },
    });

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    return customer.toJSON();
  }

  /**
   * Update customer
   */
  async updateCustomer(id: string, data: UpdateCustomerDTO) {
    const existingCustomer = await Customer.findByPk(id);

    if (!existingCustomer) {
      throw new AppError(404, 'Customer not found');
    }

    // Check phone uniqueness if updating
    if (data.phone && data.phone !== existingCustomer.phone) {
      const phoneExists = await Customer.findOne({
        where: { 
          phone: data.phone,
          id: { [Op.ne]: id },
        },
      });

      if (phoneExists) {
        throw new AppError(400, 'Phone number already in use');
      }
    }

    // Check NIC uniqueness if updating
    if (data.nicNumber && data.nicNumber !== existingCustomer.nicNumber) {
      const nicExists = await Customer.findOne({
        where: { 
          nicNumber: data.nicNumber,
          id: { [Op.ne]: id },
        },
      });

      if (nicExists) {
        throw new AppError(400, 'NIC number already in use');
      }
    }

    // Check email uniqueness if updating
    if (data.email && data.email !== existingCustomer.email) {
      const emailExists = await Customer.findOne({
        where: { 
          email: data.email,
          id: { [Op.ne]: id },
        },
      });

      if (emailExists) {
        throw new AppError(400, 'Email already in use');
      }
    }

    await existingCustomer.update(data);

    // Reload with location
    await existingCustomer.reload({
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address'],
        },
      ],
    });

    return existingCustomer.toJSON();
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(id: string) {
    console.log('CustomerService.deleteCustomer called with:', {
      id,
      idType: typeof id,
      idLength: id?.length,
    });
    
    const customer = await Customer.findByPk(id);

    console.log('Found customer:', customer ? customer.customerId : 'NOT FOUND');

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    // Check if customer has active job sheets
    const activeJobSheets = await JobSheet.count({
      where: {
        customerId: id,
        status: {
          [Op.notIn]: ['DELIVERED', 'CANCELLED'],
        },
      },
    });

    if (activeJobSheets > 0) {
      throw new AppError(
        400,
        'Cannot delete customer with active job sheets. Please complete or cancel all job sheets first.'
      );
    }

    // Soft delete by setting isActive to false
    await customer.update({ isActive: false });

    return { message: 'Customer deactivated successfully' };
  }

  /**
   * Add loyalty points
   */
  async addLoyaltyPoints(id: string, points: number) {
    const customer = await Customer.findByPk(id);

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    await customer.update({
      loyaltyPoints: customer.loyaltyPoints + points,
    });

    return customer.toJSON();
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(locationId?: string) {
    const where = locationId ? { locationId } : {};

    const [total, walkIn, regular, vip, active] = await Promise.all([
      Customer.count({ where }),
      Customer.count({ where: { ...where, customerType: 'WALK_IN' } }),
      Customer.count({ where: { ...where, customerType: 'REGULAR' } }),
      Customer.count({ where: { ...where, customerType: 'VIP' } }),
      Customer.count({ where: { ...where, isActive: true } }),
    ]);

    return {
      total,
      walkIn,
      regular,
      vip,
      active,
      inactive: total - active,
    };
  }

  /**
   * Search customers by phone or name
   */
  async searchCustomers(searchTerm: string, limit: number = 10) {
    const where: any = {
      isActive: true,
    };

    if (searchTerm) {
      const searchVal = searchTerm.trim();

      // Build phone variants for flexible matching
      const phoneVariants: string[] = [searchVal];

      // If search starts with 0, also search for +94 and 94 variants
      if (searchVal.startsWith('0')) {
        const withoutZero = searchVal.substring(1);
        phoneVariants.push(`+94${withoutZero}`);
        phoneVariants.push(`94${withoutZero}`);
      }

      // If search starts with +94 or 94, also add variant with leading 0
      if (/^(?:\+94|94)/.test(searchVal)) {
        const withoutCode = searchVal.replace(/^\+?94/, '');
        phoneVariants.push(`0${withoutCode}`);
      }

      // Remove duplicates
      const uniquePhones = Array.from(new Set(phoneVariants));

      // Build OR conditions
      const orConditions: any[] = [
        { name: { [Op.iLike]: `%${searchVal}%` } },
        { customerId: { [Op.iLike]: `%${searchVal}%` } },
        { email: { [Op.iLike]: `%${searchVal}%` } },
      ];

      // Add phone contains conditions for each variant
      uniquePhones.forEach((p) => {
        orConditions.push({ phone: { [Op.like]: `%${p}%` } });
      });

      where[Op.or] = orConditions;
    }

    const customers = await Customer.findAll({
      where,
      limit,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address'],
        },
      ],
      attributes: [
        'id',
        'customerId',
        'name',
        'email',
        'phone',
        'alternatePhone',
        'address',
        'city',
        'nicNumber',
        'locationId',
        'customerType',
        'loyaltyPoints',
        'notes',
        'isActive',
        'createdAt',
        'updatedAt',
        [literal('(SELECT COUNT(*) FROM "devices" WHERE "devices"."customer_id" = "Customer"."id")'), 'deviceCount'],
        [literal('(SELECT COUNT(*) FROM "job_sheets" WHERE "job_sheets"."customer_id" = "Customer"."id")'), 'jobSheetCount'],
        [literal('(SELECT COUNT(*) FROM "payments" WHERE "payments"."customer_id" = "Customer"."id")'), 'paymentCount'],
      ],
    });

    // Get total sales and count for each customer
    const customerIds = customers.map(c => c.id);
    let salesData: { customerId: string; totalSales: number; totalPurchases: number }[] = [];

    if (customerIds.length > 0) {
      const data = await Sale.findAll({
        where: {
          customerId: {
            [Op.in]: customerIds,
          },
        },
        attributes: [
          'customer_id',
          [fn('SUM', col('total_amount')), 'totalSales'],
          [fn('COUNT', col('id')), 'totalPurchases'],
        ],
        group: ['customer_id'],
        raw: true,
      }) as any[];

      salesData = data.map(d => ({
        customerId: d.customer_id,
        totalSales: parseFloat(d.totalSales) || 0,
        totalPurchases: parseInt(d.totalPurchases) || 0,
      }));
    }

    // Map customers with sales data
    const customersWithSales = customers.map(customer => {
      const customerData = customer.toJSON() as any;
      const salesInfo = salesData.find(s => s.customerId === customerData.id);

      return {
        ...customerData,
        totalPurchases: salesInfo?.totalPurchases || 0,
        totalSales: salesInfo?.totalSales || 0,
      };
    });

    return customersWithSales;
  }
}

