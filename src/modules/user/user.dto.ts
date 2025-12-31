import { z } from 'zod';

// Sri Lankan NIC validation regex
// Old format: 9 digits + V/X (e.g., 123456789V)
// New format: 12 digits (e.g., 199012345678)
const nicRegex = /^(?:\d{9}[VvXx]|\d{12})$/;

// Sri Lankan phone number validation
// Mobile: +94 7X XXX XXXX or 07X XXX XXXX
const phoneRegex = /^(?:\+94|0)?[7][0-9]{8}$/;

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    roleId: z.string().uuid('Invalid role ID'),
    // Optional staff fields - auto-create staff record if role is ADMIN/MANAGER/STAFF
    nicNumber: z.string().regex(nicRegex, 'Invalid Sri Lankan NIC number').optional(),
    phoneNumber: z.string().regex(phoneRegex, 'Invalid Sri Lankan phone number').optional(),
    dateOfBirth: z.string().datetime().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    roleId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    phoneNumber: z.string().refine(val => val === '' || phoneRegex.test(val), 'Invalid Sri Lankan phone number').optional(),
    additionalPhone: z.string().refine(val => val === '' || phoneRegex.test(val), 'Invalid Sri Lankan phone number').optional(),
    address: z.string().optional(),
    nicNumber: z.string().refine(val => val === '' || nicRegex.test(val), 'Invalid Sri Lankan NIC number').optional(),
    dateOfBirth: z.string().optional(),
    emergencyContact: z.string().refine(val => val === '' || phoneRegex.test(val), 'Invalid Sri Lankan phone number').optional(),
    emergencyName: z.string().refine(val => val === '' || val.length >= 2, 'Emergency contact name must be at least 2 characters if provided').optional(),
    emergencyRelation: z.string().optional(),
    qualifications: z.string().optional(),
    experience: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  }),
});

