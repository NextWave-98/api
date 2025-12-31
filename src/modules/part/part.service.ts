import prisma from '../../shared/config/database';
import { AppError } from '../../shared/utils/app-error';
import { withPrismaErrorHandling } from '../../shared/utils/sequelize-error-handler';
import { CreatePartDTO, UpdatePartDTO, PartQueryDTO } from './part.dto';

// export class PartService {
//   private async generatePartNumber(): Promise<string> {
//     return withPrismaErrorHandling(async () => {
//       const lastPart = await prisma.part.findFirst({
//         orderBy: { partNumber: 'desc' },
//         select: { partNumber: true },
//       });

//       if (!lastPart) {
//         return 'PRT-0001';
//       }

//       const lastNumber = parseInt(lastPart.partNumber.replace('PRT-', ''), 10);
//       const nextNumber = lastNumber + 1;
//       return `PRT-${nextNumber.toString().padStart(4, '0')}`;
//     }, 'Part');
//   }

//   async createPart(data: CreatePartDTO) {
//     return withPrismaErrorHandling(async () => {
//       const partNumber = await this.generatePartNumber();

//       const part = await prisma.part.create({
//         data: {
//           partNumber,
//           ...data,
//         },
//       });

//       return part;
//     }, 'Part');
//   }

//   async getParts(query: PartQueryDTO) {
//     return withPrismaErrorHandling(async () => {
//       const page = parseInt(query.page) || 1;
//       const limit = parseInt(query.limit) || 10;
//       const skip = (page - 1) * limit;

//       const where: any = {};

//       if (query.search) {
//         where.OR = [
//           { partNumber: { contains: query.search, mode: 'insensitive' } },
//           { name: { contains: query.search, mode: 'insensitive' } },
//           { brand: { contains: query.search, mode: 'insensitive' } },
//           { model: { contains: query.search, mode: 'insensitive' } },
//         ];
//       }

//       if (query.category) {
//         where.category = query.category;
//       }

//       if (query.brand) {
//         where.brand = { contains: query.brand, mode: 'insensitive' };
//       }

//       if (query.isActive !== undefined) {
//         where.isActive = query.isActive === 'true';
//       }

//       const [parts, total] = await Promise.all([
//         prisma.part.findMany({
//           where,
//           skip,
//           take: limit,
//           orderBy: { createdAt: 'desc' },
//           include: {
//             _count: {
//               select: {
//                 inventory: true,
//                 jobSheetParts: true,
//                 stockMovements: true,
//               },
//             },
//           },
//         }),
//         prisma.part.count({ where }),
//       ]);

//       return {
//         parts,
//         pagination: {
//           total,
//           page,
//           limit,
//           totalPages: Math.ceil(total / limit),
//         },
//       };
//     }, 'Part');
//   }

//   async getPartById(id: string) {
//     return withPrismaErrorHandling(async () => {
//       const part = await prisma.part.findUnique({
//         where: { id },
//         include: {
//           inventory: {
//             include: {
//               location: {
//                 select: {
//                   id: true,
//                   name: true,
//                   address: true,
//                 },
//               },
//             },
//           },
//           jobSheetParts: {
//             take: 10,
//             orderBy: { createdAt: 'desc' },
//             include: {
//               jobSheet: {
//                 select: {
//                   id: true,
//                   jobNumber: true,
//                   status: true,
//                 },
//               },
//             },
//           },
//           stockMovements: {
//             take: 20,
//             orderBy: { createdAt: 'desc' },
//           },
//           _count: {
//             select: {
//               inventory: true,
//               jobSheetParts: true,
//               stockMovements: true,
//             },
//           },
//         },
//       });

//       if (!part) {
//         throw new AppError(404, 'Part not found');
//       }

//       return part;
//     }, 'Part');
//   }

//   async getPartByPartNumber(partNumber: string) {
//     return withPrismaErrorHandling(async () => {
//       const part = await prisma.part.findUnique({
//         where: { partNumber },
//         include: {
//           inventory: {
//             include: {
//               location: true,
//             },
//           },
//         },
//       });

//       if (!part) {
//         throw new AppError(404, 'Part not found');
//       }

//       return part;
//     }, 'Part');
//   }

//   async updatePart(id: string, data: UpdatePartDTO) {
//     return withPrismaErrorHandling(async () => {
//       const existingPart = await prisma.part.findUnique({
//         where: { id },
//       });

//       if (!existingPart) {
//         throw new AppError(404, 'Part not found');
//       }

//       const part = await prisma.part.update({
//         where: { id },
//         data,
//       });

//       return part;
//     }, 'Part');
//   }

//   async deletePart(id: string) {
//     return withPrismaErrorHandling(async () => {
//       const part = await prisma.part.findUnique({
//         where: { id },
//         include: {
//           _count: {
//             select: {
//               inventory: true,
//               jobSheetParts: true,
//             },
//           },
//         },
//       });

//       if (!part) {
//         throw new AppError(404, 'Part not found');
//       }

//       if (part._count.inventory > 0) {
//         throw new AppError(400, 'Cannot delete part with existing inventory records');
//       }

//       if (part._count.jobSheetParts > 0) {
//         throw new AppError(400, 'Cannot delete part used in job sheets');
//       }

//       await prisma.part.delete({
//         where: { id },
//       });

//       return { message: 'Part deleted successfully' };
//     }, 'Part');
//   }

//   async getPartStats() {
//     return withPrismaErrorHandling(async () => {
//       // Get all parts with their inventory to check for low stock
//       const allParts = await prisma.part.findMany({
//         include: {
//           inventory: true,
//         },
//       });

//       const lowStockCount = allParts.filter((part) => {
//         return part.inventory.some((inv) => inv.quantity <= part.minStockLevel);
//       }).length;

//       const [total, active, byCategory] = await Promise.all([
//         prisma.part.count(),
//         prisma.part.count({ where: { isActive: true } }),
//         prisma.part.groupBy({
//           by: ['category'],
//           _count: true,
//         }),
//       ]);

//       const categoryStats = byCategory.reduce((acc: any, item) => {
//         acc[item.category] = item._count;
//         return acc;
//       }, {});

//       return {
//         total,
//         active,
//         lowStock: lowStockCount,
//         byCategory: categoryStats,
//       };
//     }, 'Part');
//   }

//   async searchParts(searchTerm: string, limit: number = 10) {
//     return withPrismaErrorHandling(async () => {
//       const parts = await prisma.part.findMany({
//         where: {
//           OR: [
//             { partNumber: { contains: searchTerm, mode: 'insensitive' } },
//             { name: { contains: searchTerm, mode: 'insensitive' } },
//             { brand: { contains: searchTerm, mode: 'insensitive' } },
//             { model: { contains: searchTerm, mode: 'insensitive' } },
//           ],
//           isActive: true,
//         },
//         take: limit,
//         select: {
//           id: true,
//           partNumber: true,
//           name: true,
//           category: true,
//           brand: true,
//           model: true,
//           unitPrice: true,
//           costPrice: true,
//         },
//       });

//       return parts;
//     }, 'Part');
//   }
// }

