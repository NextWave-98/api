import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { JwtUtils } from '../utils/jwt';
import { asyncHandler } from '../utils/async-handler';
import { User } from '../../models/user.model';
import { Role } from '../../models/role.model';
import { Permission } from '../../models/permission.model';
import { Location } from '../../models/location.model';

// Authenticate user
export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = JwtUtils.verifyAccessToken(token);

      const user = await User.findByPk(decoded.userId, {
        include: [
          {
            model: Role,
            as: 'role',
            include: [
              {
                model: Permission,
                as: 'permissions',
              },
            ],
          },
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'location_code', 'isActive'],
          },
        ],
      });

      if (!user || !user.isActive) {
        throw new AppError(401, 'User not found or inactive');
      }

      // If user has a location, check if location is active
      if (user.location && !user.location.isActive) {
        throw new AppError(403, 'Your assigned location is currently inactive');
      }

      req.user = {
        userId: user.id,
        email: user.email,
        roleName: user.role!.name,
        permissions: user.role!.permissions!.map((p: any) => p.name),
        locationId: user.location?.id,
      };

      console.log('🔐 AUTH MIDDLEWARE - User set on request:', {
        userId: req.user.userId,
        email: req.user.email,
        roleName: req.user.roleName
      });

      next();
    } catch (error) {
      throw new AppError(401, 'Invalid or expired token');
    }
  }
);

// Authorize by role
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    if (!roles.includes(req.user.roleName)) {
      throw new AppError(403, 'Access denied. Insufficient permissions.');
    }

    next();
  };
};

// Authorize by permission
export const authorizePermissions = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const hasPermission = permissions.some((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      throw new AppError(403, 'Access denied. Required permissions: ' + permissions.join(', '));
    }

    next();
  };
};

// Check if admin
export const isAdmin = authorizeRoles('ADMIN');

// Check if staff or admin
export const isStaffOrAdmin = authorizeRoles('STAFF', 'ADMIN');

// Middleware to ensure user has branch access (Admin can access all branches)
export const requireBranchAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError(401, 'Not authenticated');
  }

  // Admin has access to all branches
  if (req.user.roleName === 'ADMIN') {
    return next();
  }

  // Other users must have a branch assigned
  if (!req.user.branchId) {
    throw new AppError(403, 'You must be assigned to a branch to access this resource');
  }

  next();
};

// Middleware to validate branch ID in request matches user's branch (unless Admin)
export const validateBranchAccess = (branchIdParamName = 'branchId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    // Admin can access any branch
    if (req.user.roleName === 'ADMIN') {
      return next();
    }

    // Get branch ID from params, query, or body
    const requestedBranchId = 
      req.params[branchIdParamName] || 
      req.query[branchIdParamName] || 
      (req.body && req.body[branchIdParamName]);

    // If no branch ID in request, allow (will be filtered in service layer)
    if (!requestedBranchId) {
      return next();
    }

    // Check if user's branch matches requested branch
    if (req.user.branchId !== requestedBranchId) {
      throw new AppError(403, 'Access denied. You can only access resources from your assigned branch');
    }

    next();
  };
};

