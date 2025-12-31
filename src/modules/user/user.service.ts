// import bcrypt from 'bcryptjs';
// import { AppError } from '../../shared/utils/app-error';
// import sequelize from '../../shared/config/database';
// import { UniqueConstraintError } from 'sequelize';

// export class UserService {
//   /**
//    * Generate next staff ID in format SEF0001, SEF0002, etc.
//    */
//   private async generateStaffId(): Promise<string> {
//     const lastStaff = await prisma.staff.findFirst({
//       orderBy: { staffId: 'desc' },
//       select: { staffId: true },
//     });

//     if (!lastStaff) {
//       return 'SEF0001';
//     }

//     // Extract number from last staff ID (e.g., SEF0001 -> 1)
//     const lastNumber = parseInt(lastStaff.staffId.replace('SEF', ''), 10);
//     const nextNumber = lastNumber + 1;

//     // Format with leading zeros (SEF0001, SEF0002, etc.)
//     return `SEF${nextNumber.toString().padStart(4, '0')}`;
//   }

//   async createUser(data: { 
//     email: string; 
//     name: string; 
//     password: string; 
//     roleId: string;
//     nicNumber?: string;
//     phoneNumber?: string;
//     dateOfBirth?: string;
//   }) {
//     const existing = await prisma.user.findUnique({
//       where: { email: data.email },
//     });

//     if (existing) {
//       throw new AppError(400, 'User already exists');
//     }

//     const hashedPassword = await bcrypt.hash(data.password, 12);

//     // Get role information to check if we need to create a staff record
//     const role = await prisma.role.findUnique({
//       where: { id: data.roleId },
//     });

//     if (!role) {
//       throw new AppError(404, 'Role not found');
//     }

//     // Check if NIC is required and provided for staff-type users
//     const isStaffType = ['ADMIN', 'MANAGER', 'STAFF'].includes(role.name);
    
//     if (isStaffType && data.nicNumber) {
//       const existingNIC = await prisma.staff.findUnique({
//         where: { nicNumber: data.nicNumber },
//       });

//       if (existingNIC) {
//         throw new AppError(400, 'NIC number already exists');
//       }
//     }

//     // Create user and staff record in a transaction
//     let result;
//     try {
//       result = await prisma.$transaction(async (tx) => {
//         const user = await tx.user.create({
//           data: {
//             email: data.email,
//             name: data.name,
//             password: hashedPassword,
//             roleId: data.roleId,
//           },
//           include: {
//             role: {
//               select: {
//                 id: true,
//                 name: true,
//                 description: true,
//               },
//             },
//           },
//         });

//         // Auto-create staff record for ADMIN, MANAGER, and STAFF roles
//         if (isStaffType) {
//           const staffId = await this.generateStaffId();
          
//           await tx.staff.create({
//             data: {
//               staffId,
//               userId: user.id,
//               nicNumber: data.nicNumber || `TEMP-${user.id.substring(0, 8)}`, // Temporary NIC if not provided
//               phoneNumber: data.phoneNumber || data.email,
//               dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
//               joiningDate: new Date(),
//             },
//           });
//         }

//         return user;
//       });
//     } catch (error) {
//       if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
//         const target = error.meta?.target as string[];
//         if (target?.includes('email')) {
//           throw new AppError(400, 'Email already exists');
//         }
//         if (target?.includes('phoneNumber')) {
//           throw new AppError(400, 'Phone number already exists');
//         }
//         // Handle other uniques
//         throw new AppError(400, 'Duplicate entry');
//       }
//       throw error;
//     }

//     const { password, refreshToken, ...userWithoutSensitive } = result;
//     return userWithoutSensitive;
//   }

//   async getAllUsers(page = 1, limit = 10) {
//     const skip = (page - 1) * limit;

//     const [users, total] = await Promise.all([
//       prisma.user.findMany({
//         skip,
//         take: limit,
//         select: {
//           id: true,
//           email: true,
//           name: true,
//           isActive: true,
//           lastLogin: true,
//           createdAt: true,
//           role: {
//             select: {
//               id: true,
//               name: true,
//               description: true,
//             },
//           },
//           location: {
//             select: {
//               id: true,
//               name: true,
//               locationCode: true,
//             },
//           },
//         },
//         orderBy: { createdAt: 'desc' },
//       }),
//       prisma.user.count(),
//     ]);

//     return {
//       users,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     };
//   }

//   async getUserById(id: string) {
//     const user = await prisma.user.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         isActive: true,
//         lastLogin: true,
//         createdAt: true,
//         updatedAt: true,
//         role: {
//           select: {
//             id: true,
//             name: true,
//             description: true,
//             permissions: {
//               select: {
//                 id: true,
//                 name: true,
//                 description: true,
//                 module: true,
//                 action: true,
//               },
//             },
//           },
//         },
//         location: {
//           select: {
//             id: true,
//             name: true,
//             locationCode: true,
//             address: true,
//             phone: true,
//             email: true,
//           },
//         },
//       },
//     });

//     if (!user) {
//       throw new AppError(404, 'User not found');
//     }

//     return user;
//   }

//   async updateUser(
//     id: string,
//     data: { name?: string; email?: string; roleId?: string; isActive?: boolean }
//   ) {
//     const user = await prisma.user.findUnique({ where: { id } });

//     if (!user) {
//       throw new AppError(404, 'User not found');
//     }

//     if (data.email && data.email !== user.email) {
//       const existing = await prisma.user.findUnique({
//         where: { email: data.email },
//       });

//       if (existing) {
//         throw new AppError(400, 'Email already in use');
//       }
//     }

//     const updatedUser = await prisma.user.update({
//       where: { id },
//       data,
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         isActive: true,
//         lastLogin: true,
//         createdAt: true,
//         updatedAt: true,
//         role: {
//           select: {
//             id: true,
//             name: true,
//             description: true,
//           },
//         },
//         location: {
//           select: {
//             id: true,
//             name: true,
//             locationCode: true,
//           },
//         },
//       },
//     });

//     return updatedUser;
//   }

//   async deleteUser(id: string) {
//     const user = await prisma.user.findUnique({ where: { id } });

//     if (!user) {
//       throw new AppError(404, 'User not found');
//     }

//     await prisma.user.delete({ where: { id } });

//     return { message: 'User deleted successfully' };
//   }

//   async getProfile(userId: string) {
//     console.log('🔍 DEBUG - getProfile Service - START:', {
//       userId,
//       type: typeof userId,
//       length: userId?.length,
//       trimmed: userId?.trim(),
//       equals: userId === '538ea19f-c36b-4356-af04-885620f9be02'
//     });
    
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         isActive: true,
//         lastLogin: true,
//         createdAt: true,
//         role: {
//           select: {
//             id: true,
//             name: true,
//             description: true,
//           },
//         },
//         location: {
//           select: {
//             id: true,
//             name: true,
//             locationCode: true,
//             locationType: true,
//           },
//         },
//         staff: {
//           select: {
//             id: true,
//             staffId: true,
//             nicNumber: true,
//             dateOfBirth: true,
//             address: true,
//             phoneNumber: true,
//             additionalPhone: true,
//             emergencyContact: true,
//             emergencyName: true,
//             emergencyRelation: true,
//             qualifications: true,
//             experience: true,
//             joiningDate: true,
//             profileImage: true,
//             notes: true,
//           },
//         },
//       },
//     });

   

//     if (!user) {
//       throw new AppError(404, 'User not found');
//     }

//     return user;
//   }

//   async updateProfile(userId: string, data: {
//     name: string;
//     email: string;
//     phoneNumber?: string;
//     additionalPhone?: string;
//     address?: string;
//     nicNumber: string;
//     dateOfBirth?: string;
//     emergencyContact?: string;
//     emergencyName?: string;
//     emergencyRelation?: string;
//     qualifications?: string;
//     experience?: string;
//     notes?: string;
//   }) {
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       include: { staff: true },
//     });

//     if (!user) {
//       throw new AppError(404, 'User not found');
//     }

//     // If the user does not yet have a staff record, we'll create one later
//     // inside the transaction. Do not throw here so profile updates work for
//     // users who should become staff (e.g., ADMIN/MANAGER/STAFF roles) but
//     // don't have a staff record yet.

//     // Check if email is being changed and if it's already in use
//     if (data.email !== user.email) {
//       const existing = await prisma.user.findUnique({
//         where: { email: data.email },
//       });

//       if (existing) {
//         throw new AppError(400, 'Email already in use');
//       }
//     }

//     // Check if NIC is being changed and if it's already in use.
//     // If the user has no staff record yet, still validate uniqueness.
//     if (!user.staff || data.nicNumber !== user.staff.nicNumber) {
//       const existing = await prisma.staff.findUnique({
//         where: { nicNumber: data.nicNumber },
//       });

//       if (existing && (!user.staff || existing.userId !== userId)) {
//         throw new AppError(400, 'NIC number already in use');
//       }
//     }

//     // Update user and either update or create staff in a transaction.
//     const result = await prisma.$transaction(async (tx) => {
//       const updatedUser = await tx.user.update({
//         where: { id: userId },
//         data: {
//           name: data.name,
//           email: data.email,
//         },
//         select: {
//           id: true,
//           email: true,
//           name: true,
//           isActive: true,
//           lastLogin: true,
//           createdAt: true,
//           role: {
//             select: {
//               id: true,
//               name: true,
//               description: true,
//             },
//           },
//           location: {
//             select: {
//               id: true,
//               name: true,
//               locationCode: true,
//               locationType: true,
//             },
//           },
//         },
//       });

//       let staffRecord;

//       if (user.staff) {
//         // Update existing staff
//         staffRecord = await tx.staff.update({
//           where: { userId },
//           data: {
//             phoneNumber: data.phoneNumber,
//             additionalPhone: data.additionalPhone,
//             address: data.address,
//             nicNumber: data.nicNumber,
//             dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
//             emergencyContact: data.emergencyContact,
//             emergencyName: data.emergencyName,
//             emergencyRelation: data.emergencyRelation,
//             qualifications: data.qualifications,
//             experience: data.experience,
//             notes: data.notes,
//           },
//         });
//       } else {
//         // Create staff record for users missing one.
//         const lastStaff = await tx.staff.findFirst({
//           orderBy: { staffId: 'desc' },
//           select: { staffId: true },
//         });

//         const nextStaffId = lastStaff
//           ? `SEF${(parseInt(lastStaff.staffId.replace('SEF', ''), 10) + 1)
//               .toString()
//               .padStart(4, '0')}`
//           : 'SEF0001';

//         staffRecord = await tx.staff.create({
//           data: {
//             staffId: nextStaffId,
//             userId,
//             nicNumber: data.nicNumber,
//             phoneNumber: data.phoneNumber || data.email,
//             additionalPhone: data.additionalPhone,
//             address: data.address,
//             dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
//             emergencyContact: data.emergencyContact,
//             emergencyName: data.emergencyName,
//             emergencyRelation: data.emergencyRelation,
//             qualifications: data.qualifications,
//             experience: data.experience,
//             joiningDate: new Date(),
//             notes: data.notes,
//           },
//         });
//       }

//       return { user: updatedUser, staff: staffRecord };
//     });

//     return result;
//   }

//   async changePassword(userId: string, currentPassword: string, newPassword: string) {
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       throw new AppError(404, 'User not found');
//     }

//     // Verify current password
//     const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
//     if (!isCurrentPasswordValid) {
//       throw new AppError(400, 'Current password is incorrect');
//     }

//     // Hash new password
//     const hashedNewPassword = await bcrypt.hash(newPassword, 12);

//     // Update password
//     await prisma.user.update({
//       where: { id: userId },
//       data: { password: hashedNewPassword },
//     });

//     return { message: 'Password changed successfully' };
//   }

//   async exportUserData(userId: string) {
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         isActive: true,
//         lastLogin: true,
//         createdAt: true,
//         updatedAt: true,
//         role: {
//           select: {
//             id: true,
//             name: true,
//             description: true,
//           },
//         },
//         location: {
//           select: {
//             id: true,
//             name: true,
//             locationCode: true,
//             locationType: true,
//           },
//         },
//         staff: {
//           select: {
//             id: true,
//             staffId: true,
//             nicNumber: true,
//             dateOfBirth: true,
//             address: true,
//             phoneNumber: true,
//             additionalPhone: true,
//             emergencyContact: true,
//             emergencyName: true,
//             emergencyRelation: true,
//             qualifications: true,
//             experience: true,
//             joiningDate: true,
//             profileImage: true,
//             notes: true,
//             createdAt: true,
//             updatedAt: true,
//           },
//         },
//         createdJobSheets: {
//           select: {
//             id: true,
//             jobNumber: true,
//             status: true,
//             createdAt: true,
//           },
//           orderBy: { createdAt: 'desc' },
//           take: 10,
//         },
//         assignedJobSheets: {
//           select: {
//             id: true,
//             jobNumber: true,
//             status: true,
//             createdAt: true,
//           },
//           orderBy: { createdAt: 'desc' },
//           take: 10,
//         },
//         soldSales: {
//           select: {
//             id: true,
//             saleNumber: true,
//             totalAmount: true,
//             createdAt: true,
//           },
//           orderBy: { createdAt: 'desc' },
//           take: 10,
//         },
//         activityLogs: {
//           select: {
//             id: true,
//             action: true,
//             details: true,
//             createdAt: true,
//           },
//           orderBy: { createdAt: 'desc' },
//           take: 20,
//         },
//       },
//     });

//     if (!user) {
//       throw new AppError(404, 'User not found');
//     }

//     return {
//       user,
//       exportDate: new Date().toISOString(),
//       dataTypes: [
//         'Profile Information',
//         'Staff Details',
//         'Recent Job Sheets Created',
//         'Recent Job Sheets Assigned',
//         'Recent Sales',
//         'Recent Activity Logs',
//       ],
//     };
//   }
// }

