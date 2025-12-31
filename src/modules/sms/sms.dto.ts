import { z } from 'zod';

/**
 * Phone number validation regex for Sri Lankan numbers
 * Accepts: 0771234567, 771234567, 947xxxxxxxx, +947xxxxxxxx
 */
const phoneRegex = /^(\+?94|0)?[1-9]\d{8}$/;

/**
 * DTO for sending single SMS
 */
export const SendSingleSMSSchema = z.object({
  to: z.string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(15, 'Phone number is too long')
    .regex(phoneRegex, 'Invalid Sri Lankan phone number format. Use: 0771234567 or 947xxxxxxxx'),
  msg: z.string()
    .min(1, 'Message is required')
    .max(612, 'Message exceeds maximum length of 612 characters (4 SMS segments)')
    .refine(val => val.trim().length > 0, 'Message cannot be empty or only whitespace'),
  senderID: z.string()
    .min(3, 'Sender ID must be at least 3 characters')
    .max(11, 'Sender ID cannot exceed 11 characters')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Sender ID can only contain letters, numbers, and spaces')
    .optional(),
});

export type SendSingleSMSDTO = z.infer<typeof SendSingleSMSSchema>;

/**
 * DTO for sending bulk SMS with same message
 */
export const SendBulkSameSMSSchema = z.object({
  to: z.array(
    z.string()
      .min(9, 'Phone number must be at least 9 digits')
      .max(15, 'Phone number is too long')
      .regex(phoneRegex, 'Invalid phone number format')
  )
    .min(1, 'At least one recipient is required')
    .max(1000, 'Maximum 1000 recipients allowed per bulk request')
    .refine(arr => new Set(arr).size === arr.length, 'Duplicate phone numbers found'),
  msg: z.string()
    .min(1, 'Message is required')
    .max(612, 'Message exceeds maximum length of 612 characters')
    .refine(val => val.trim().length > 0, 'Message cannot be empty or only whitespace'),
  senderID: z.string()
    .min(3, 'Sender ID must be at least 3 characters')
    .max(11, 'Sender ID cannot exceed 11 characters')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Sender ID can only contain letters, numbers, and spaces')
    .optional(),
});

export type SendBulkSameSMSDTO = z.infer<typeof SendBulkSameSMSSchema>;

/**
 * DTO for sending bulk SMS with different messages
 */
export const SendBulkDifferentSMSSchema = z.object({
  msgList: z.array(z.object({
    to: z.string()
      .min(9, 'Phone number must be at least 9 digits')
      .max(15, 'Phone number is too long')
      .regex(phoneRegex, 'Invalid phone number format'),
    msg: z.string()
      .min(1, 'Message is required')
      .max(612, 'Message exceeds maximum length of 612 characters')
      .refine(val => val.trim().length > 0, 'Message cannot be empty or only whitespace'),
  }))
    .min(1, 'At least one message is required')
    .max(500, 'Maximum 500 different messages allowed per request')
    .refine(
      arr => {
        const phones = arr.map(item => item.to);
        return new Set(phones).size === phones.length;
      },
      'Duplicate phone numbers found in message list'
    ),
  senderID: z.string()
    .min(3, 'Sender ID must be at least 3 characters')
    .max(11, 'Sender ID cannot exceed 11 characters')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Sender ID can only contain letters, numbers, and spaces')
    .optional(),
});

export type SendBulkDifferentSMSDTO = z.infer<typeof SendBulkDifferentSMSSchema>;

/**
 * SMS Config interface
 */
export interface SMSConfig {
  username: string; // QuickSend email
  apiKey: string; // QuickSend API key
  senderID: string; // Default sender ID
  apiUrl: string; // QuickSend API base URL
  enabled: boolean; // Enable/disable SMS service
}

/**
 * SMS Response from QuickSend
 */
export interface SMSResponse {
  success: boolean;
  message: string;
  data?: any;
  cost?: number;
  credits?: number;
  balance?: number;
  deliveryWarning?: boolean;
}

/**
 * SMS Template Types
 */
export enum SMSTemplateType {
  SALE_CONFIRMATION = 'SALE_CONFIRMATION',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  JOBSHEET_CREATED = 'JOBSHEET_CREATED',
  JOBSHEET_COMPLETED = 'JOBSHEET_COMPLETED',
  WARRANTY_REMINDER = 'WARRANTY_REMINDER',
  CUSTOM = 'CUSTOM',
}

/**
 * SMS Log
 */
export interface SMSLog {
  id: string;
  type: SMSTemplateType;
  recipient: string;
  message: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  response?: string;
  referenceId?: string;
  referenceType?: string;
  sentAt: Date;
  createdAt: Date;
}

