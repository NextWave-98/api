// import sequelize from '../../shared/config/database';
// import { AppError } from '../../shared/utils/app-error';
// import { CreateStaffDTO, UpdateStaffDTO } from './staff.dto';
// import bcrypt from 'bcryptjs';
// import { uploadToCloudinary, deleteFromCloudinary, updateImageInCloudinary } from '../../shared/config/cloudinary';
// import { UniqueConstraintError } from 'sequelize';

// export class StaffService {
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
//   async getStaffDashboard(userId?: string, locationId?: string) {
//     // Build where clause for staff filtering
//     const staffWhere: any = {};
//     const userWhere: any = {
//       role: {
//         name: {
//           in: ['STAFF', 'MANAGER', 'ADMIN'],
//         },
//       },
//     };

//     if (locationId) {
//       userWhere.locationId = locationId;
//       staffWhere.user = {
//         locationId: locationId,
//         role: {
//           name: {
//             in: ['STAFF', 'MANAGER', 'ADMIN'],
//           },
//         },
//       };
//     } else {
//       staffWhere.user = {
//         role: {
//           name: {
//             in: ['STAFF', 'MANAGER', 'ADMIN'],
//           },
//         },
//       };
//     }

//     const [totalStaff, activeStaff, recentStaff] = await Promise.all([
//       prisma.staff.count({ where: staffWhere }),
//       prisma.staff.count({
//         where: {
//           ...staffWhere,
//           user: { ...staffWhere.user, isActive: true }
//         }
//       }),
//       prisma.staff.findMany({
//         take: 10,
//         where: staffWhere,
//         orderBy: { createdAt: 'desc' },
//         include: {
//           user: {
//             select: {
//               id: true,
//               email: true,
//               name: true,
//               isActive: true,
//               createdAt: true,
//               role: {
//                 select: {
//                   name: true,
//                 },
//               },
//               location: {
//                 select: {
//                   id: true,
//                   name: true,
//                   locationCode: true,
//                 },
//               },
//             },
//           },
//         },
//       }),
//     ]);

//     return {
//       stats: {
//         totalStaff,
//         activeStaff,
//         inactiveStaff: totalStaff - activeStaff,
//       },
//       recentStaff,
//     };
//   }

//   async getStaffList(page = 1, limit = 10, locationId?: string) {
//     const skip = (page - 1) * limit;

//     // Build where clause
//     const where: any = {
//       role: {
//         name: {
//           in: ['STAFF', 'MANAGER', 'ADMIN'],
//         },
//       },
//     };

//     if (locationId) {
//       where.locationId = locationId;
//     }

//     const [staff, total] = await Promise.all([
//       prisma.user.findMany({
//         skip,
//         take: limit,
//         where,
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
//       prisma.user.count({ where }),
//     ]);

//     return {
//       staff,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     };
//   }

//   async getStaffById(id: string, requestingUserLocationId?: string) {
//     const staff = await prisma.user.findUnique({
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

//     if (!staff) {
//       throw new AppError(404, 'Staff member not found');
//     }

//     // Check if staff belongs to STAFF, MANAGER, or ADMIN role
//     if (!['STAFF', 'MANAGER', 'ADMIN'].includes(staff.role.name)) {
//       throw new AppError(400, 'User is not a staff member');
//     }

//     // If requesting user is not admin, check location access
//     if (requestingUserLocationId && staff.location?.id !== requestingUserLocationId) {
//       throw new AppError(403, 'Access denied. Staff member belongs to different location');
//     }

//     return staff;
//   }

//   async getMyLocationInfo(userId: string) {
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         role: {
//           select: {
//             id: true,
//             name: true,
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
//             isActive: true,
//           },
//         },
//       },
//     });

//     if (!user) {
//       throw new AppError(404, 'User not found');
//     }

//     if (user.role.name === 'ADMIN') {
//       return {
//         user: {
//           id: user.id,
//           email: user.email,
//           name: user.name,
//           role: user.role,
//         },
//         location: null,
//         message: 'Admin has access to all locations',
//       };
//     }

//     if (!user.location) {
//       throw new AppError(404, 'User is not assigned to any location');
//     }

//     return {
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//         role: user.role,
//       },
//       location: user.location,
//     };
//   }

//   // Create new staff member
//   async createStaff(data: CreateStaffDTO, requestingUserLocationId?: string) {
//     // Check if email already exists
//     const existingUser = await prisma.user.findUnique({
//       where: { email: data.email },
//     });

//     if (existingUser) {
//       throw new AppError(400, 'Email already exists');
//     }

//     // Check if NIC already exists
//     const existingNIC = await prisma.staff.findUnique({
//       where: { nicNumber: data.nicNumber },
//     });

//     if (existingNIC) {
//       throw new AppError(400, 'NIC number already exists');
//     }

//     // Verify role exists and is STAFF, MANAGER, or ADMIN
//     const role = await prisma.role.findUnique({
//       where: { id: data.roleId },
//     });

//     if (!role) {
//       throw new AppError(404, 'Role not found');
//     }

//     if (!['STAFF', 'MANAGER', 'ADMIN'].includes(role.name)) {
//       throw new AppError(400, 'Can only create staff members with STAFF, MANAGER, or ADMIN role');
//     }

//     // Verify location exists if provided
//     if (data.locationId) {
//       const location = await prisma.location.findUnique({
//         where: { id: data.locationId },
//       });

//       if (!location) {
//         throw new AppError(404, 'Location not found');
//       }

//       // If requesting user is not admin, ensure they can only create staff for their location
//       if (requestingUserLocationId && data.locationId !== requestingUserLocationId) {
//         throw new AppError(403, 'You can only create staff for your own location');
//       }
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(data.password, 10);

//     // Generate next staff ID
//     const staffId = await this.generateStaffId();

//     // Create user and staff in a transaction
//     let result: { user: any; staff: any };
//     try {
//       result = await prisma.$transaction(async (tx) => {
//         const user = await tx.user.create({
//           data: {
//             email: data.email,
//             name: data.name,
//             password: hashedPassword,
//             roleId: data.roleId,
//             locationId: data.locationId,
//           },
//         });

//         const staff = await tx.staff.create({
//           data: {
//             staffId,
//             userId: user.id,
//             nicNumber: data.nicNumber,
//             dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
//             address: data.address,
//             phoneNumber: data.phoneNumber,
//             additionalPhone: data.additionalPhone,
//             emergencyContact: data.emergencyContact,
//             emergencyName: data.emergencyName,
//             emergencyRelation: data.emergencyRelation,
//             qualifications: data.qualifications,
//             experience: data.experience,
//             joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
//             notes: data.notes,
//           },
//         });

//         return { user, staff };
//       });
//     } catch (error) {
//       const prismaError = error as PrismaClientKnownRequestError;
//       if (prismaError.code === 'P2002') {
//         const target = prismaError.meta?.target as string[];
//         if (target?.includes('phoneNumber')) {
//           throw new AppError(400, 'Phone number already exists');
//         }
//         // Handle other uniques if needed
//         throw new AppError(400, 'Duplicate entry');
//       }
//       throw error;
//     }

//     // Fetch complete staff data
//     return this.getStaffDetailsById(result.user.id, requestingUserLocationId);
//   }

//   // Get detailed staff information by user ID
//   async getStaffDetailsById(userId: string, requestingUserLocationId?: string) {
//     const staff = await prisma.staff.findUnique({
//       where: { userId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             email: true,
//             name: true,
//             isActive: true,
//             lastLogin: true,
//             createdAt: true,
//             updatedAt: true,
//             role: {
//               select: {
//                 id: true,
//                 name: true,
//                 description: true,
//               },
//             },
//             location: {
//               select: {
//                 id: true,
//                 name: true,
//                 locationCode: true,
//                 address: true,
//                 phone: true,
//                 email: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!staff) {
//       throw new AppError(404, 'Staff member not found');
//     }

//     // If requesting user is not admin, check location access
//     if (requestingUserLocationId && staff.user.location?.id !== requestingUserLocationId) {
//       throw new AppError(403, 'Access denied. Staff member belongs to different location');
//     }

//     return staff;
//   }

//   // Update staff member
//   async updateStaff(userId: string, data: UpdateStaffDTO, requestingUserLocationId?: string) {
//     // Check if staff exists
//     const existingStaff = await prisma.staff.findUnique({
//       where: { userId },
//       include: {
//         user: {
//           select: {
//             locationId: true,
//           },
//         },
//       },
//     });

//     if (!existingStaff) {
//       throw new AppError(404, 'Staff member not found');
//     }

//     // If requesting user is not admin, check location access
//     if (requestingUserLocationId && existingStaff.user.locationId !== requestingUserLocationId) {
//       throw new AppError(403, 'Access denied. Staff member belongs to different location');
//     }

//     // Check for duplicate email if email is being updated
//     if (data.email) {
//       const existingUser = await prisma.user.findFirst({
//         where: {
//           email: data.email,
//           NOT: { id: userId },
//         },
//       });

//       if (existingUser) {
//         throw new AppError(400, 'Email already exists');
//       }
//     }

//     // Check for duplicate NIC if NIC is being updated
//     if (data.nicNumber) {
//       const existingNIC = await prisma.staff.findFirst({
//         where: {
//           nicNumber: data.nicNumber,
//           NOT: { userId },
//         },
//       });

//       if (existingNIC) {
//         throw new AppError(400, 'NIC number already exists');
//       }
//     }

//     // Verify role if being updated
//     if (data.roleId) {
//       const role = await prisma.role.findUnique({
//         where: { id: data.roleId },
//       });

//       if (!role) {
//         throw new AppError(404, 'Role not found');
//       }

//       if (!['STAFF', 'MANAGER', 'ADMIN'].includes(role.name)) {
//         throw new AppError(400, 'Can only assign STAFF, MANAGER, or ADMIN role');
//       }
//     }

//     // Verify location if being updated
//     if (data.locationId !== undefined) {
//       if (data.locationId) {
//         const location = await prisma.location.findUnique({
//           where: { id: data.locationId },
//         });

//         if (!location) {
//           throw new AppError(404, 'Location not found');
//         }

//         // If requesting user is not admin, ensure they can only assign to their location
//         if (requestingUserLocationId && data.locationId !== requestingUserLocationId) {
//           throw new AppError(403, 'You can only assign staff to your own location');
//         }
//       }
//     }

//     // Prepare user update data
//     const userUpdateData: any = {};
//     if (data.email) userUpdateData.email = data.email;
//     if (data.name) userUpdateData.name = data.name;
//     if (data.password) userUpdateData.password = await bcrypt.hash(data.password, 10);
//     if (data.roleId) userUpdateData.roleId = data.roleId;
//     if (data.locationId !== undefined) userUpdateData.locationId = data.locationId;
//     if (data.isActive !== undefined) userUpdateData.isActive = data.isActive;

//     // Prepare staff update data
//     const staffUpdateData: any = {};
//     if (data.nicNumber) staffUpdateData.nicNumber = data.nicNumber;
//     if (data.dateOfBirth !== undefined) {
//       staffUpdateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
//     }
//     if (data.address !== undefined) staffUpdateData.address = data.address;
//     if (data.phoneNumber !== undefined) staffUpdateData.phoneNumber = data.phoneNumber;
//     if (data.additionalPhone !== undefined) staffUpdateData.additionalPhone = data.additionalPhone;
//     if (data.emergencyContact !== undefined) staffUpdateData.emergencyContact = data.emergencyContact;
//     if (data.emergencyName !== undefined) staffUpdateData.emergencyName = data.emergencyName;
//     if (data.emergencyRelation !== undefined) staffUpdateData.emergencyRelation = data.emergencyRelation;
//     if (data.qualifications !== undefined) staffUpdateData.qualifications = data.qualifications;
//     if (data.experience !== undefined) staffUpdateData.experience = data.experience;
//     if (data.joiningDate !== undefined) {
//       staffUpdateData.joiningDate = data.joiningDate ? new Date(data.joiningDate) : null;
//     }
//     if (data.notes !== undefined) staffUpdateData.notes = data.notes;

//     // Update user and staff in a transaction
//     try {
//       await prisma.$transaction(async (tx) => {
//         if (Object.keys(userUpdateData).length > 0) {
//           await tx.user.update({
//             where: { id: userId },
//             data: userUpdateData,
//           });
//         }

//         if (Object.keys(staffUpdateData).length > 0) {
//           await tx.staff.update({
//             where: { userId },
//             data: staffUpdateData,
//           });
//         }
//       });
//     } catch (error) {
//       const prismaError = error as PrismaClientKnownRequestError;
//       if (prismaError.code === 'P2002') {
//         const target = prismaError.meta?.target as string[];
//         if (target?.includes('phoneNumber')) {
//           throw new AppError(400, 'Phone number already exists');
//         }
//         // Handle other uniques if needed
//         throw new AppError(400, 'Duplicate entry');
//       }
//       throw error;
//     }

//     return this.getStaffDetailsById(userId, requestingUserLocationId);
//   }

//   // Update staff profile image with Cloudinary
//   async updateStaffImage(userId: string, imageBuffer: Buffer, requestingUserLocationId?: string) {
//     const staff = await prisma.staff.findUnique({
//       where: { userId },
//       include: {
//         user: {
//           select: {
//             locationId: true,
//           },
//         },
//       },
//     });

//     if (!staff) {
//       throw new AppError(404, 'Staff member not found');
//     }

//     // If requesting user is not admin, check location access
//     if (requestingUserLocationId && staff.user.locationId !== requestingUserLocationId) {
//       throw new AppError(403, 'Access denied. Staff member belongs to different location');
//     }

//     // Upload to Cloudinary (delete old image if exists)
//     const { url, publicId } = await updateImageInCloudinary(
//       imageBuffer,
//       staff.cloudinaryPublicId,
//       'staff'
//     );

//     // Update database with new image URL and public ID
//     await prisma.staff.update({
//       where: { userId },
//       data: { 
//         profileImage: url,
//         cloudinaryPublicId: publicId,
//       },
//     });

//     return this.getStaffDetailsById(userId, requestingUserLocationId);
//   }

//   // Delete staff member (soft delete by deactivating user, optionally delete image)
//   async deleteStaff(userId: string, requestingUserLocationId?: string, deleteImage: boolean = false) {
//     const staff = await prisma.staff.findUnique({
//       where: { userId },
//       include: {
//         user: {
//           select: {
//             locationId: true,
//             isActive: true,
//           },
//         },
//       },
//     });

//     if (!staff) {
//       throw new AppError(404, 'Staff member not found');
//     }

//     // If requesting user is not admin, check location access
//     if (requestingUserLocationId && staff.user.locationId !== requestingUserLocationId) {
//       throw new AppError(403, 'Access denied. Staff member belongs to different location');
//     }

//     // Delete image from Cloudinary if requested
//     if (deleteImage && staff.cloudinaryPublicId) {
//       await deleteFromCloudinary(staff.cloudinaryPublicId);
//     }

//     // Soft delete by deactivating the user
//     await prisma.user.update({
//       where: { id: userId },
//       data: { isActive: false },
//     });

//     return { message: 'Staff member deactivated successfully' };
//   }

//   // Get all staff with filters
//   async getAllStaff(
//     page = 1,
//     limit = 10,
//     requestingUserLocationId?: string,
//     filters?: {
//       search?: string;
//       locationId?: string;
//       roleId?: string;
//       isActive?: boolean;
//     }
//   ) {
//     const skip = (page - 1) * limit;

//     // Build base user where conditions (without search)
//     const baseUserWhere: any = {
//       role: {
//         name: {
//           in: ['STAFF', 'MANAGER', 'ADMIN'],
//         },
//       },
//     };

//     // If requesting user is not admin, filter by their location
//     if (requestingUserLocationId) {
//       baseUserWhere.locationId = requestingUserLocationId;
//     }

//     // Apply location filter
//     if (filters?.locationId) {
//       baseUserWhere.locationId = filters.locationId;
//     }

//     // Apply role filter
//     if (filters?.roleId) {
//       baseUserWhere.roleId = filters.roleId;
//     }

//     // Apply active status filter
//     if (filters?.isActive !== undefined) {
//       baseUserWhere.isActive = filters.isActive;
//     }

//     // Build staff where clause
//     let staffWhere: any;

//     if (filters?.search) {
//       // When searching, use AND with OR for search fields
//       staffWhere = {
//         AND: [
//           { user: baseUserWhere },
//           {
//             OR: [
//               { user: { name: { contains: filters.search, mode: 'insensitive' } } },
//               { user: { email: { contains: filters.search, mode: 'insensitive' } } },
//               { nicNumber: { contains: filters.search, mode: 'insensitive' } },
//             ],
//           },
//         ],
//       };
//     } else {
//       // No search, just filter by user conditions
//       staffWhere = {
//         user: baseUserWhere,
//       };
//     }

//     try {
//       console.log('getAllStaff - where clause:', JSON.stringify(staffWhere, null, 2));

//       const [staff, total] = await Promise.all([
//         prisma.staff.findMany({
//           skip,
//           take: limit,
//           where: staffWhere,
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 email: true,
//                 name: true,
//                 isActive: true,
//                 lastLogin: true,
//                 createdAt: true,
//                 role: {
//                   select: {
//                     id: true,
//                     name: true,
//                     description: true,
//                   },
//                 },
//                 location: {
//                   select: {
//                     id: true,
//                     name: true,
//                     locationCode: true,
//                   },
//                 },
//               },
//             },
//           },
//           orderBy: { createdAt: 'desc' },
//         }),
//         prisma.staff.count({ where: staffWhere }),
//       ]);

//       console.log(`getAllStaff - found ${staff.length} staff members, total: ${total}`);

//       return {
//         staff,
//         pagination: {
//           total,
//           page,
//           limit,
//           totalPages: Math.ceil(total / limit),
//         },
//       };
//     } catch (error) {
//       console.error('Error in getAllStaff:', error);
//       throw error;
//     }
//   }

//   /**
//    * Assign or reassign staff to a location
//    */
//   async assignStaffToLocation(userId: string, locationId: string | null, requestingUserLocationId?: string) {
//     // Check if user exists
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       include: {
//         role: { select: { name: true } },
//         location: { select: { id: true, name: true, locationCode: true } },
//         staff: true,
//       },
//     });

//     if (!user) {
//       throw new AppError(404, 'User not found');
//     }

//     // Check if user has staff record
//     if (!user.staff) {
//       throw new AppError(400, 'User is not a staff member');
//     }

//     // If locationId is provided, verify it exists
//     if (locationId) {
//       const location = await prisma.location.findUnique({
//         where: { id: locationId },
//       });

//       if (!location) {
//         throw new AppError(404, 'Location not found');
//       }

//       // Check if location is active
//       if (!location.isActive) {
//         throw new AppError(400, 'Cannot assign to inactive location');
//       }
//     }

//     // Store previous location info for activity log
//     const previousLocation = user.location;

//     // Update user's location
//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: { locationId },
//       include: {
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
//             address: true,
//           },
//         },
//         staff: true,
//       },
//     });

//     return {
//       success: true,
//       message: locationId 
//         ? `Staff member assigned to ${updatedUser.location?.name || 'location'} successfully`
//         : 'Staff member unassigned from location successfully',
//       user: {
//         id: updatedUser.id,
//         email: updatedUser.email,
//         name: updatedUser.name,
//         role: updatedUser.role,
//         location: updatedUser.location,
//         previousLocation: previousLocation,
//       },
//     };
//   }
// }

