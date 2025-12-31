import { z } from 'zod';

// Sri Lankan phone number validation
const phoneRegex = /^(?:\+94|0)?[7][0-9]{8}$/;

// Sri Lankan NIC validation
const nicRegex = /^(?:\d{9}[VvXx]|\d{12})$/;

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional().nullable(),
    phone: z.string().regex(phoneRegex, 'Invalid Sri Lankan phone number'),
    alternatePhone: z.string().regex(phoneRegex, 'Invalid alternate phone number').optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    nicNumber: z.string().regex(nicRegex, 'Invalid Sri Lankan NIC number').optional().nullable(),
    locationId: z.string().uuid('Invalid location ID').optional().nullable(),
    branchId: z.string().uuid('Invalid branch ID').optional().nullable(), // Accept branchId from frontend
    customerType: z.enum(['WALK_IN', 'REGULAR', 'VIP']).default('WALK_IN'),
    loyaltyPoints: z.number().int().min(0).default(0),
    notes: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  }).transform((data) => {
    // Map branchId to locationId if branchId is provided
    const { branchId, ...rest } = data;
    return {
      ...rest,
      locationId: data.locationId || branchId, // Use locationId if provided, otherwise use branchId
    };
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional().nullable(),
    phone: z.string().regex(phoneRegex, 'Invalid Sri Lankan phone number').optional(),
    alternatePhone: z.string().regex(phoneRegex, 'Invalid alternate phone number').optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    nicNumber: z.string().regex(nicRegex, 'Invalid Sri Lankan NIC number').optional().nullable(),
    locationId: z.string().uuid('Invalid location ID').optional().nullable(),
    branchId: z.string().uuid('Invalid branch ID').optional().nullable(), // Accept branchId from frontend
    customerType: z.enum(['WALK_IN', 'REGULAR', 'VIP']).optional(),
    loyaltyPoints: z.number().int().min(0).optional(),
    notes: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }).transform((data) => {
    // Map branchId to locationId if branchId is provided
    const { branchId, ...rest } = data;
    return {
      ...rest,
      locationId: data.locationId || branchId, // Use locationId if provided, otherwise use branchId
    };
  }),
});

export const customerQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional(),
    customerType: z.enum(['WALK_IN', 'REGULAR', 'VIP']).optional(),
    locationId: z.string().uuid().optional(),
    isActive: z.string().optional(),
  }),
});

export type CreateCustomerDTO = z.infer<typeof createCustomerSchema>['body'];
export type UpdateCustomerDTO = z.infer<typeof updateCustomerSchema>['body'];
export type CustomerQueryDTO = z.infer<typeof customerQuerySchema>['query'];

