import { z } from 'zod';

// Sri Lankan NIC validation regex
// Old format: 9 digits + V/X (e.g., 123456789V)
// New format: 12 digits (e.g., 199012345678)
const nicRegex = /^(?:\d{9}[VvXx]|\d{12})$/;

// Sri Lankan phone number validation
// Mobile: +94 7X XXX XXXX or 07X XXX XXXX
const phoneRegex = /^(?:\+94|0)?[7][0-9]{8}$/;

export const createStaffSchema = z.object({
  body: z.object({
    // User data
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    roleId: z.string().uuid('Invalid role ID'),
    locationId: z.string().uuid('Invalid location ID').optional(),
    
    // Staff specific data
    nicNumber: z.string().regex(nicRegex, 'Invalid Sri Lankan NIC number'),
    dateOfBirth: z.string().datetime().optional(),
    address: z.string().optional(),
    phoneNumber: z.string().regex(phoneRegex, 'Invalid Sri Lankan phone number').optional(),
    additionalPhone: z.string().regex(phoneRegex, 'Invalid Sri Lankan phone number').optional(),
    emergencyContact: z.string().regex(phoneRegex, 'Invalid emergency contact number').optional(),
    emergencyName: z.string().optional(),
    emergencyRelation: z.string().optional(),
    qualifications: z.string().optional(),
    experience: z.string().optional(),
    joiningDate: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
}).refine((data) => {
  const { phoneNumber, additionalPhone, emergencyContact } = data.body;
  if (phoneNumber) {
    if (additionalPhone && additionalPhone === phoneNumber) return false;
    if (emergencyContact && emergencyContact === phoneNumber) return false;
  }
  return true;
}, {
  message: "Additional phone and emergency contact cannot be the same as the primary phone number",
  path: ["body"]
});

export const updateStaffSchema = z.object({
  body: z.object({
    // User data (optional for updates)
    email: z.string().email('Invalid email address').optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    roleId: z.string().uuid('Invalid role ID').optional(),
    locationId: z.string().uuid('Invalid location ID').optional().nullable(),
    isActive: z.boolean().optional(),
    
    // Staff specific data (optional for updates)
    nicNumber: z.string().regex(nicRegex, 'Invalid Sri Lankan NIC number').optional(),
    dateOfBirth: z.string().datetime().optional().nullable(),
    address: z.string().optional().nullable(),
    phoneNumber: z.string().regex(phoneRegex, 'Invalid Sri Lankan phone number').optional().nullable(),
    additionalPhone: z.string().regex(phoneRegex, 'Invalid Sri Lankan phone number').optional().nullable(),
    emergencyContact: z.string().regex(phoneRegex, 'Invalid emergency contact number').optional().nullable(),
    emergencyName: z.string().optional().nullable(),
    emergencyRelation: z.string().optional().nullable(),
    qualifications: z.string().optional().nullable(),
    experience: z.string().optional().nullable(),
    joiningDate: z.string().datetime().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
}).refine((data) => {
  const { phoneNumber, additionalPhone, emergencyContact } = data.body;
  if (phoneNumber) {
    if (additionalPhone && additionalPhone === phoneNumber) return false;
    if (emergencyContact && emergencyContact === phoneNumber) return false;
  }
  return true;
}, {
  message: "Additional phone and emergency contact cannot be the same as the primary phone number",
  path: ["body"]
});

export const updateStaffImageSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid staff ID'),
  }),
});

export const getStaffByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid staff ID'),
  }),
});

export const deleteStaffSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid staff ID'),
  }),
});

export const assignLocationSchema = z.object({
  body: z.object({
    locationId: z.string().uuid('Invalid location ID').nullable().optional(),
    branchId: z.string().uuid('Invalid branch ID').nullable().optional(),
  }),
}).refine((data) => data.body.locationId !== undefined || data.body.branchId !== undefined, {
  message: 'Either locationId or branchId must be provided',
  path: ['body'],
}).transform((data) => ({
  ...data,
  body: {
    locationId: data.body.locationId !== undefined ? data.body.locationId : data.body.branchId,
  },
}));

export type CreateStaffDTO = z.infer<typeof createStaffSchema>['body'];
export type UpdateStaffDTO = z.infer<typeof updateStaffSchema>['body'];
export type AssignLocationDTO = z.infer<typeof assignLocationSchema>['body'];

