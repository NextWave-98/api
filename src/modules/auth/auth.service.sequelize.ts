import bcrypt from 'bcryptjs';
import { AppError } from '../../shared/utils/app-error';
import { JwtUtils } from '../../shared/utils/jwt';
import { User, Role, Permission, Location } from '../../models';

export class AuthService {
  async register(data: { email: string; name: string; password: string }) {
    const existing = await User.findOne({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError(400, 'User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Get default USER role
    const userRole = await Role.findOne({
      where: { name: 'USER' },
      include: [
        {
          association: 'permissions',
        },
      ],
    });

    if (!userRole) {
      throw new AppError(500, 'Default user role not found');
    }

    const user = await User.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      roleId: userRole.id,
    });

    // Reload with relations
    await user.reload({
      include: [
        {
          model: Role,
          as: 'role',
          include: [
            {
              association: 'permissions',
            },
          ],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode'],
        },
      ],
    });

    const userData = user.toJSON() as any;

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roleName: userData.role.name,
      permissions: userData.role.permissions.map((p: any) => p.name),
    };

    const accessToken = JwtUtils.generateAccessToken(tokenPayload);
    const refreshToken = JwtUtils.generateRefreshToken(tokenPayload);

    await user.update({ 
      refreshToken, 
      lastLogin: new Date() 
    });

    const { password, refreshToken: _, ...userWithoutSensitive } = userData;

    // Add top-level locationId/locationCode for frontend convenience
    const userWithLocationInfo = {
      ...userWithoutSensitive,
      locationId: userData.location ? userData.location.id : null,
      locationCode: userData.location ? userData.location.locationCode : null,
    };

    return {
      user: userWithLocationInfo,
      accessToken,
      refreshToken,
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await User.findOne({
      where: { email: data.email },
      include: [
        {
          model: Role,
          as: 'role',
          include: [
            {
              association: 'permissions',
            },
          ],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode', 'isActive'],
        },
      ],
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new AppError(401, 'Account is inactive');
    }

    const userData = user.toJSON() as any;

    // Check if user's location is active (if assigned to a location)
    if (userData.location && !userData.location.isActive) {
      throw new AppError(403, 'Your assigned location is currently inactive');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Check if non-ADMIN users are assigned to a branch
    if (userData.role.name !== 'ADMIN' && !userData.location) {
      throw new AppError(403, 'Access denied.! You do not have enough permission to perform this Action. Please contact the Owner');
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roleName: userData.role.name,
      permissions: userData.role.permissions.map((p: any) => p.name),
    };

    const accessToken = JwtUtils.generateAccessToken(tokenPayload);
    const refreshToken = JwtUtils.generateRefreshToken(tokenPayload);

    await user.update({ 
      refreshToken, 
      lastLogin: new Date() 
    });

    const { password, refreshToken: _, ...userWithoutSensitive } = userData;

    // Attach locationId/locationCode at the top-level of the user payload
    const userWithLocationInfo = {
      ...userWithoutSensitive,
      locationId: userData.location ? userData.location.id : null,
      locationCode: userData.location ? userData.location.locationCode : null,
    };

    return {
      user: userWithLocationInfo,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = JwtUtils.verifyRefreshToken(token);

      const user = await User.findByPk(decoded.userId, {
        include: [
          {
            model: Role,
            as: 'role',
            include: [
              {
                association: 'permissions',
              },
            ],
          },
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'locationCode'],
          },
        ],
      });

      if (!user || user.refreshToken !== token || !user.isActive) {
        throw new AppError(401, 'Invalid refresh token');
      }

      const userData = user.toJSON() as any;

      const tokenPayload = {
        userId: user.id,
        email: user.email,
        roleName: userData.role.name,
        permissions: userData.role.permissions.map((p: any) => p.name),
      };

      const accessToken = JwtUtils.generateAccessToken(tokenPayload);
      const newRefreshToken = JwtUtils.generateRefreshToken(tokenPayload);

      await user.update({ refreshToken: newRefreshToken });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await User.update(
      { refreshToken: null },
      { where: { id: userId } }
    );

    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await user.update({ 
      password: hashedPassword, 
      refreshToken: null 
    });

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await User.findByPk(userId, {
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
          attributes: ['id', 'name', 'locationCode', 'address', 'phone', 'email', 'isActive'],
        },
      ],
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const userData = user.toJSON() as any;

    // Add convenience fields for client: locationId and locationCode
    const userWithLocationInfo = {
      ...userData,
      locationId: userData?.location?.id ?? null,
      locationCode: userData?.location?.locationCode ?? null,
    };

    return userWithLocationInfo;
  }
}

