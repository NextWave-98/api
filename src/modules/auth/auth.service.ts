// import bcrypt from 'bcryptjs';
// import { AppError } from '../../shared/utils/app-error';
// import { JwtUtils } from '../../shared/utils/jwt';
// import sequelize from '../../shared/config/database';
// import { User } from '../../models/user.model';
// import { Role } from '../../models/role.model';
// import { Location } from '../../models/location.model';

// export class AuthService {
//   async register(data: { email: string; name: string; password: string }) {
//     const existing = await User.findOne({
//       where: { email: data.email },
//     });

//     if (existing) {
//       throw new AppError(400, 'User with this email already exists');
//     }

//     const hashedPassword = await bcrypt.hash(data.password, 12);

//     // Get default USER role
//     const userRole = await Role.findOne({
//       where: { name: 'USER' },
//       include: [{ model: require('../../models/permission.model').Permission, as: 'permissions' }],
//     });

//     if (!userRole) {
//       throw new AppError(500, 'Default user role not found');
//     }

//     const user = await User.create({
//       email: data.email,
//       name: data.name,
//       password: hashedPassword,
//       roleId: userRole.id,
//     }, {
//       include: [
//         {
//           model: Role,
//           as: 'role',
//           include: [
//             {
//               model: require('../../models/permission.model').Permission,
//               as: 'permissions'
//             }
//           ]
//         },
//         {
//           model: Location,
//           as: 'location',
//           attributes: ['id', 'name', 'locationCode']
//         }
//       ]
//     });

//     const tokenPayload = {
//       userId: user.id,
//       email: user.email,
//       roleName: user.role.name,
//       permissions: user.role.permissions.map((p: any) => p.name),
//     };

//     const accessToken = JwtUtils.generateAccessToken(tokenPayload);
//     const refreshToken = JwtUtils.generateRefreshToken(tokenPayload);

//     await User.update({
//       refreshToken,
//       lastLogin: new Date()
//     }, {
//       where: { id: user.id }
//     });

//     const { password, refreshToken: _, ...userWithoutSensitive } = user;

//     // Add top-level locationId/locationCode for frontend convenience
//     const userWithLocationInfo = {
//       ...userWithoutSensitive,
//       locationId: user.location ? user.location.id : null,
//       locationCode: user.location ? user.location.locationCode : null,
//     };

//     return {
//       user: userWithLocationInfo,
//       accessToken,
//       refreshToken,
//     };
//   }

//   async login(data: { email: string; password: string }) {
//     const user = await User.findOne({
//       where: { email: data.email },
//       include: [
//         {
//           model: Role,
//           as: 'role',
//           include: [
//             {
//               model: require('../../models/permission.model').Permission,
//               as: 'permissions'
//             }
//           ]
//         },
//         {
//           model: Location,
//           as: 'location',
//           attributes: ['id', 'name', 'locationCode', 'isActive']
//         }
//       ]
//     });

//     if (!user) {
//       throw new AppError(401, 'Invalid credentials');
//     }

//     if (!user.isActive) {
//       throw new AppError(401, 'Account is inactive');
//     }

//     // Check if user's location is active (if assigned to a location)
//     if (user.location && !user.location.isActive) {
//       throw new AppError(403, 'Your assigned location is currently inactive');
//     }

//     const isPasswordValid = await bcrypt.compare(data.password, user.password);
//     if (!isPasswordValid) {
//       throw new AppError(401, 'Invalid credentials');
//     }

//     const tokenPayload = {
//       userId: user.id,
//       email: user.email,
//       roleName: user.role.name,
//       permissions: user.role.permissions.map((p: any) => p.name),
//     };

//     const accessToken = JwtUtils.generateAccessToken(tokenPayload);
//     const refreshToken = JwtUtils.generateRefreshToken(tokenPayload);

//     await User.update({
//       refreshToken,
//       lastLogin: new Date()
//     }, {
//       where: { id: user.id }
//     });

//     const { password, refreshToken: _, ...userWithoutSensitive } = user;

//     // Attach locationId/locationCode at the top-level of the user payload
//     const userWithLocationInfo = {
//       ...userWithoutSensitive,
//       locationId: user.location ? user.location.id : null,
//       locationCode: user.location ? user.location.locationCode : null,
//     };

//     return {
//       user: userWithLocationInfo,
//       accessToken,
//       refreshToken,
//     };
//   }

//   async refreshToken(token: string) {
//     try {
//       const decoded = JwtUtils.verifyRefreshToken(token);

//       const user = await User.findOne({
//         where: { id: decoded.userId },
//         include: [
//           {
//             model: Role,
//             as: 'role',
//             include: [
//               {
//                 model: require('../../models/permission.model').Permission,
//                 as: 'permissions'
//               }
//             ]
//           },
//           {
//             model: Location,
//             as: 'location',
//             attributes: ['id', 'name', 'locationCode']
//           }
//         ]
//       });

//       if (!user || user.refreshToken !== token || !user.isActive) {
//         throw new AppError(401, 'Invalid refresh token');
//       }

//       const tokenPayload = {
//         userId: user.id,
//         email: user.email,
//         roleName: user.role.name,
//         permissions: user.role.permissions.map((p: any) => p.name),
//       };

//       const accessToken = JwtUtils.generateAccessToken(tokenPayload);
//       const newRefreshToken = JwtUtils.generateRefreshToken(tokenPayload);

//       await User.update({
//         refreshToken: newRefreshToken
//       }, {
//         where: { id: user.id }
//       });

//       return {
//         accessToken,
//         refreshToken: newRefreshToken,
//       };
//     } catch (error) {
//       throw new AppError(401, 'Invalid or expired refresh token');
//     }
//   }

//   async logout(userId: string) {
//     await User.update({
//       refreshToken: null
//     }, {
//       where: { id: userId }
//     });

//     return { message: 'Logged out successfully' };
//   }

//   async changePassword(userId: string, oldPassword: string, newPassword: string) {
//     const user = await User.findOne({
//       where: { id: userId },
//     });

//     if (!user) {
//       throw new AppError(404, 'User not found');
//     }

//     const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
//     if (!isPasswordValid) {
//       throw new AppError(401, 'Invalid old password');
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 12);

//     await User.update({
//       password: hashedPassword,
//       refreshToken: null
//     }, {
//       where: { id: userId }
//     });

//     return { message: 'Password changed successfully' };
//   }

//   async getProfile(userId: string) {
//     const user = await User.findOne({
//       where: { id: userId },
//       attributes: ['id', 'email', 'name', 'isActive', 'lastLogin', 'createdAt'],
//       include: [
//         {
//           model: Role,
//           as: 'role',
//           attributes: ['id', 'name', 'description'],
//           include: [
//             {
//               model: require('../../models/permission.model').Permission,
//               as: 'permissions',
//               attributes: ['id', 'name', 'description', 'module', 'action']
//             }
//           ]
//         },
//         {
//           model: Location,
//           as: 'location',
//           attributes: ['id', 'name', 'locationCode', 'address', 'phone', 'email', 'isActive']
//         }
//       ]
//     });

//     if (!user) {
//       throw new AppError(404, 'User not found');
//     }

//     // Add convenience fields for client: locationId and locationCode
//     const userWithLocationInfo = {
//       ...user,
//       locationId: user?.location?.id ?? null,
//       locationCode: user?.location?.locationCode ?? null,
//     };

//     return userWithLocationInfo;
//   }
// }

