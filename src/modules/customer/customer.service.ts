// import sequelize from '../../shared/config/database';
// import { AppError } from '../../shared/utils/app-error';
// import { CreateCustomerDTO, UpdateCustomerDTO, CustomerQueryDTO } from './customer.dto';

// export class CustomerService {
//   /**
//    * Generate next customer ID in format CUS0001, CUS0002, etc.
//    */
//   private async generateCustomerId(): Promise<string> {
//     const lastCustomer = await prisma.customer.findFirst({
//       orderBy: { customerId: 'desc' },
//       select: { customerId: true },
//     });

//     if (!lastCustomer) {
//       return 'CUS0001';
//     }

//     const lastNumber = parseInt(lastCustomer.customerId.replace('CUS', ''), 10);
//     const nextNumber = lastNumber + 1;
//     return `CUS${nextNumber.toString().padStart(4, '0')}`;
//   }

//   /**
//    * Create a new customer
//    */
//   async createCustomer(data: CreateCustomerDTO) {
//     // Check if phone already exists
//     const existingPhone = await prisma.customer.findFirst({
//       where: { phone: data.phone },
//     });

//     if (existingPhone) {
//       throw new AppError(400, 'Customer with this phone number already exists');
//     }

//     // Check if NIC already exists (if provided)
//     if (data.nicNumber) {
//       const existingNic = await prisma.customer.findFirst({
//         where: { nicNumber: data.nicNumber },
//       });

//       if (existingNic) {
//         throw new AppError(400, 'Customer with this NIC number already exists');
//       }
//     }

//     // Check if email already exists (if provided)
//     if (data.email) {
//       const existingEmail = await prisma.customer.findFirst({
//         where: { email: data.email },
//       });

//       if (existingEmail) {
//         throw new AppError(400, 'Customer with this email already exists');
//       }
//     }

//     const customerId = await this.generateCustomerId();

//     const customer = await prisma.customer.create({
//       data: {
//         customerId,
//         ...data,
//       },
//       include: {
//         location: {
//           select: {
//             id: true,
//             name: true,
//             address: true,
//           },
//         },
//       },
//     });

//     return customer;
//   }

//   /**
//    * Get all customers with pagination and filters
//    */
//   async getCustomers(query: CustomerQueryDTO) {
//     const page = parseInt(query.page) || 1;
//     const limit = parseInt(query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const where: any = {};

//     if (query.search) {
//       // Build phone variants to match common stored formats
//       const searchVal = query.search;
//       const phoneVariants: string[] = [searchVal];

//       // If search looks like it starts with 0 (e.g. 078...), also try variant without leading 0
//       if (/^0\d+/.test(searchVal)) {
//         const withoutZero = searchVal.replace(/^0/, '');
//         phoneVariants.push(withoutZero);
//         phoneVariants.push(`+94${withoutZero}`);
//         phoneVariants.push(`94${withoutZero}`);
//       }

//       // If search starts with +94 or 94, also add variant with leading 0
//       if (/^(?:\+94|94)\d+/.test(searchVal)) {
//         const withoutCode = searchVal.replace(/^\+?94/, '');
//         phoneVariants.push(`0${withoutCode}`);
//       }

//       // Remove duplicates
//       const uniquePhones = Array.from(new Set(phoneVariants));

//       // Build OR conditions. Use case-insensitive where supported for textual fields.
//       const orConditions: any[] = [
//         { customerId: { contains: searchVal, mode: 'insensitive' } },
//         { name: { contains: searchVal, mode: 'insensitive' } },
//         { email: { contains: searchVal, mode: 'insensitive' } },
//         { nicNumber: { contains: searchVal } },
//       ];

//       // Add phone contains conditions for each variant
//       uniquePhones.forEach((p) => {
//         orConditions.push({ phone: { contains: p } });
//       });

//       where.OR = orConditions;
//     }

//     if (query.customerType) {
//       where.customerType = query.customerType;
//     }

//     if (query.locationId) {
//       where.locationId = query.locationId;
//     }

//     if (query.isActive !== undefined) {
//       where.isActive = query.isActive === 'true';
//     }

//     const [customers, total] = await Promise.all([
//       prisma.customer.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: { createdAt: 'desc' },
//         include: {
//           location: {
//             select: {
//               id: true,
//               name: true,
//               address: true,
//             },
//           },
//           _count: {
//             select: {
//               devices: true,
//               jobSheets: true,
//               payments: true,
//             },
//           },
//         },
//       }),
//       prisma.customer.count({ where }),
//     ]);

//     // Get total sales and count for each customer
//     const customerIds = customers.map(c => c.id);
//     let salesData: { customerId: string; totalSales: number; totalPurchases: number }[] = [];
//     if (customerIds.length > 0) {
//       const data = await prisma.sale.groupBy({
//         by: ['customerId'],
//         where: {
//           customerId: {
//             in: customerIds,
//           },
//         },
//         _sum: {
//           totalAmount: true,
//         },
//         _count: true,
//       });
//       salesData = data.map(d => ({
//         customerId: d.customerId!,
//         totalSales: Number(d._sum.totalAmount) || 0,
//         totalPurchases: d._count,
//       }));
//     }

//     // Add sales data to customers
//     customers.forEach(customer => {
//       const data = salesData.find(d => d.customerId === customer.id);
//       (customer as any).totalSales = data ? data.totalSales : 0;
//       (customer as any).totalPurchases = data ? data.totalPurchases : 0;
//     });

//     // Debug log to help troubleshooting search queries (can be removed later)
//     try {
//       // Avoid logging sensitive full data; only log the filter and pagination
//       // eslint-disable-next-line no-console
//       console.log('[CustomerService.getCustomers] where filter:', JSON.stringify(where));
//     } catch (err) {
//       // ignore
//     }

//     return {
//       customers,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     };
//   }

//   /**
//    * Get customer by ID
//    */
//   async getCustomerById(id: string) {
//     const customer = await prisma.customer.findUnique({
//       where: { id },
//       include: {
//         location: {
//           select: {
//             id: true,
//             name: true,
//             address: true,
//             phone: true,
//           },
//         },
//         devices: {
//           include: {
//             _count: {
//               select: {
//                 jobSheets: true,
//               },
//             },
//           },
//         },
//         jobSheets: {
//           take: 10,
//           orderBy: { createdAt: 'desc' },
//           include: {
//             device: {
//               select: {
//                 deviceType: true,
//                 brand: true,
//                 model: true,
//               },
//             },
//           },
//         },
//         payments: {
//           take: 10,
//           orderBy: { paymentDate: 'desc' },
//         },
//         _count: {
//           select: {
//             devices: true,
//             jobSheets: true,
//             payments: true,
//             notifications: true,
//           },
//         },
//       },
//     });

//     if (!customer) {
//       throw new AppError(404, 'Customer not found');
//     }

//     return customer;
//   }

//   /**
//    * Get customer by customerId
//    */
//   async getCustomerByCustomerId(customerId: string) {
//     const customer = await prisma.customer.findUnique({
//       where: { customerId },
//       include: {
//         location: true,
//         devices: true,
//         _count: {
//           select: {
//             jobSheets: true,
//             payments: true,
//           },
//         },
//       },
//     });

//     if (!customer) {
//       throw new AppError(404, 'Customer not found');
//     }

//     return customer;
//   }

//   /**
//    * Update customer
//    */
//   async updateCustomer(id: string, data: UpdateCustomerDTO) {
//     const existingCustomer = await prisma.customer.findUnique({
//       where: { id },
//     });

//     if (!existingCustomer) {
//       throw new AppError(404, 'Customer not found');
//     }

//     // Check phone uniqueness if updating
//     if (data.phone && data.phone !== existingCustomer.phone) {
//       const phoneExists = await prisma.customer.findFirst({
//         where: { phone: data.phone, id: { not: id } },
//       });

//       if (phoneExists) {
//         throw new AppError(400, 'Phone number already in use');
//       }
//     }

//     // Check NIC uniqueness if updating
//     if (data.nicNumber && data.nicNumber !== existingCustomer.nicNumber) {
//       const nicExists = await prisma.customer.findFirst({
//         where: { nicNumber: data.nicNumber, id: { not: id } },
//       });

//       if (nicExists) {
//         throw new AppError(400, 'NIC number already in use');
//       }
//     }

//     // Check email uniqueness if updating
//     if (data.email && data.email !== existingCustomer.email) {
//       const emailExists = await prisma.customer.findFirst({
//         where: { email: data.email, id: { not: id } },
//       });

//       if (emailExists) {
//         throw new AppError(400, 'Email already in use');
//       }
//     }

//     const customer = await prisma.customer.update({
//       where: { id },
//       data,
//       include: {
//         location: {
//           select: {
//             id: true,
//             name: true,
//             address: true,
//           },
//         },
//       },
//     });

//     return customer;
//   }

//   /**
//    * Delete customer (soft delete)
//    */
//   async deleteCustomer(id: string) {
//     console.log('CustomerService.deleteCustomer called with:', {
//       id,
//       idType: typeof id,
//       idLength: id?.length,
//     });
    
//     const customer = await prisma.customer.findUnique({
//       where: { id },
//       include: {
//         _count: {
//           select: {
//             jobSheets: true,
//             devices: true,
//           },
//         },
//       },
//     });

//     console.log('Found customer:', customer ? customer.customerId : 'NOT FOUND');

//     if (!customer) {
//       throw new AppError(404, 'Customer not found');
//     }

//     // Check if customer has active job sheets
//     const activeJobSheets = await prisma.jobSheet.count({
//       where: {
//         customerId: id,
//         status: {
//           notIn: ['DELIVERED', 'CANCELLED'],
//         },
//       },
//     });

//     if (activeJobSheets > 0) {
//       throw new AppError(
//         400,
//         'Cannot delete customer with active job sheets. Please complete or cancel all job sheets first.'
//       );
//     }

//     // Soft delete by setting isActive to false
//     await prisma.customer.update({
//       where: { id },
//       data: { isActive: false },
//     });

//     return { message: 'Customer deactivated successfully' };
//   }

//   /**
//    * Add loyalty points
//    */
//   async addLoyaltyPoints(id: string, points: number) {
//     const customer = await prisma.customer.findUnique({
//       where: { id },
//     });

//     if (!customer) {
//       throw new AppError(404, 'Customer not found');
//     }

//     const updatedCustomer = await prisma.customer.update({
//       where: { id },
//       data: {
//         loyaltyPoints: customer.loyaltyPoints + points,
//       },
//     });

//     return updatedCustomer;
//   }

//   /**
//    * Get customer statistics
//    */
//   async getCustomerStats(locationId?: string) {
//     const where = locationId ? { locationId } : {};

//     const [total, walkIn, regular, vip, active] = await Promise.all([
//       prisma.customer.count({ where }),
//       prisma.customer.count({ where: { ...where, customerType: 'WALK_IN' } }),
//       prisma.customer.count({ where: { ...where, customerType: 'REGULAR' } }),
//       prisma.customer.count({ where: { ...where, customerType: 'VIP' } }),
//       prisma.customer.count({ where: { ...where, isActive: true } }),
//     ]);

//     return {
//       total,
//       walkIn,
//       regular,
//       vip,
//       active,
//       inactive: total - active,
//     };
//   }

//   /**
//    * Search customers by phone or name
//    */
//   async searchCustomers(searchTerm: string, limit: number = 10) {
//     const where: any = {
//       isActive: true,
//     };

//     if (searchTerm) {
//       const searchVal = searchTerm.trim();

//       // Build phone variants for flexible matching
//       const phoneVariants: string[] = [searchVal];

//       // If search starts with 0, also search for +94 and 94 variants
//       if (searchVal.startsWith('0')) {
//         const withoutZero = searchVal.substring(1);
//         phoneVariants.push(`+94${withoutZero}`);
//         phoneVariants.push(`94${withoutZero}`);
//       }

//       // If search starts with +94 or 94, also add variant with leading 0
//       if (/^(?:\+94|94)/.test(searchVal)) {
//         const withoutCode = searchVal.replace(/^\+?94/, '');
//         phoneVariants.push(`0${withoutCode}`);
//       }

//       // Remove duplicates
//       const uniquePhones = Array.from(new Set(phoneVariants));

//       // Build OR conditions
//       const orConditions: any[] = [
//         { name: { contains: searchVal, mode: 'insensitive' } },
//         { customerId: { contains: searchVal, mode: 'insensitive' } },
//       ];

//       // Add phone contains conditions for each variant
//       uniquePhones.forEach((p) => {
//         orConditions.push({ phone: { contains: p } });
//       });

//       where.OR = orConditions;
//     }

//     const customers = await prisma.customer.findMany({
//       where,
//       take: limit,
//       select: {
//         id: true,
//         customerId: true,
//         name: true,
//         phone: true,
//         email: true,
//         customerType: true,
//         loyaltyPoints: true,
//       },
//     });

//     return customers;
//   }
// }

