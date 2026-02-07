import { z } from 'zod';

// All notification types
const notificationTypes = [
  // Job Sheet Notifications
  'JOB_CREATED',
  'JOB_STARTED',
  'JOB_COMPLETED',
  'JOB_UPDATED',
  'JOB_DELETED',
  'JOB_STATUS_CHANGED',
  'JOB_ASSIGNED',
  'READY_PICKUP',
  'JOB_READY_PICKUP',
  'JOB_DIAGNOSED',
  'JOB_REPAIRING',
  'JOB_DELIVERED',
  'JOB_CANCELLED',
  'JOB_PRICE_UPDATED',
  'PAYMENT_RECEIVED',
  'JOB_REMINDER',
  // Sales Notifications
  'SALE_CREATED',
  'SALE_COMPLETED',
  'SALE_UPDATED',
  'SALE_CANCELLED',
  'SALE_PRICE_CHANGED',
  'SALE_PAYMENT_RECEIVED',
  'SALE_RECEIPT',
  'SALE_HIGH_VALUE',
  // Product Return Notifications
  'RETURN_CREATED',
  'RETURN_RECEIVED',
  'RETURN_INSPECTED',
  'RETURN_APPROVED',
  'RETURN_REJECTED',
  'RETURN_COMPLETED',
  'RETURN_REFUNDED',
  'RETURN_REPLACED',
  'RETURN_UPDATED',
  'RETURN_CANCELLED',
  // Addon Request Notifications
  'ADDON_REQUEST_CREATED',
  'ADDON_REQUEST_APPROVED',
  'ADDON_REQUEST_REJECTED',
  'ADDON_REQUEST_COMPLETED',
  // Installment Notifications
  'INSTALLMENT_PAYMENT_DUE',
  'INSTALLMENT_PAYMENT_LATE',
  'INSTALLMENT_PAYMENT_RECEIVED',
  'INSTALLMENT_DEFAULTED',
  'INSTALLMENT_PLAN_CREATED',
  'INSTALLMENT_PLAN_COMPLETED',
  // General
  'REMINDER',
  'PROMOTION',
] as const;

export const createNotificationSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid customer ID').optional().nullable(),
    jobSheetId: z.string().uuid('Invalid job sheet ID').optional().nullable(),
    saleId: z.string().uuid('Invalid sale ID').optional().nullable(),
    productReturnId: z.string().uuid('Invalid product return ID').optional().nullable(),
    type: z.enum(notificationTypes),
    eventType: z.enum([
      'CREATE',
      'UPDATE',
      'DELETE',
      'STATUS_CHANGE',
      'PRICE_UPDATE',
      'QUANTITY_UPDATE',
      'APPROVAL',
      'REJECTION',
      'ASSIGNMENT',
    ]).optional().nullable(),
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    method: z.enum(['SMS', 'EMAIL', 'WHATSAPP']),
    recipient: z.string().min(1, 'Recipient is required'),
    recipientType: z.enum(['CUSTOMER', 'ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN', 'SYSTEM']).optional().default('CUSTOMER'),
    recipientUserId: z.string().uuid('Invalid recipient user ID').optional().nullable(),
    recipientRole: z.string().optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
    workflowStage: z.string().optional().nullable(),
    parentNotificationId: z.string().uuid('Invalid parent notification ID').optional().nullable(),
    metadata: z.any().optional().nullable(),
  }),
});

export const updateNotificationStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'SENT', 'FAILED', 'DELIVERED']),
  }),
});

export const notificationQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    customerId: z.string().uuid().optional(),
    jobSheetId: z.string().uuid().optional(),
    saleId: z.string().uuid().optional(),
    productReturnId: z.string().uuid().optional(),
    recipientUserId: z.string().uuid().optional(),
    type: z.enum(notificationTypes).optional(),
    eventType: z.enum([
      'CREATE',
      'UPDATE',
      'DELETE',
      'STATUS_CHANGE',
      'PRICE_UPDATE',
      'QUANTITY_UPDATE',
      'APPROVAL',
      'REJECTION',
      'ASSIGNMENT',
    ]).optional(),
    recipientType: z.enum(['CUSTOMER', 'ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN', 'SYSTEM']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    method: z.enum(['SMS', 'EMAIL', 'WHATSAPP']).optional(),
    status: z.enum(['PENDING', 'SENT', 'FAILED', 'DELIVERED']).optional(),
    workflowStage: z.string().optional(),
  }),
});

export type CreateNotificationDTO = z.infer<typeof createNotificationSchema>['body'];
export type UpdateNotificationStatLKRTO = z.infer<typeof updateNotificationStatusSchema>['body'];
export type NotificationQueryDTO = z.infer<typeof notificationQuerySchema>['query'];

