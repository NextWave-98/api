import { z } from 'zod';

export const createBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Branch name must be at least 2 characters'),
    code: z.string().min(2, 'Branch code must be at least 2 characters').max(10, 'Branch code must be at most 10 characters').optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    phone2: z.string().optional(),
    phone3: z.string().optional(),
    email: z.string().email('Invalid email format').optional(),
  }),
});

export const updateBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().min(2).max(10).optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    phone2: z.string().optional(),
    phone3: z.string().optional(),
    email: z.string().email().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const assignUserToBranchSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    branchId: z.string().uuid('Invalid branch ID'),
  }),
});

export const getBranchUsersSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid branch ID'),
  }),
});

