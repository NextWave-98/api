import { z } from 'zod';

// Helper function to clean empty strings
const cleanEmptyStrings = (data: any) => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === '' || cleaned[key] === null) {
      cleaned[key] = undefined;
    }
  });
  return cleaned;
};

// Base business schema (logo is excluded as it's handled as file upload)
const baseBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required').optional(),
  address: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
});

// Update Business DTO with preprocessing to clean empty strings
export const updateBusinessSchema = z.preprocess(
  cleanEmptyStrings,
  baseBusinessSchema
);

export type UpdateBusinessDto = z.infer<typeof baseBusinessSchema>;
