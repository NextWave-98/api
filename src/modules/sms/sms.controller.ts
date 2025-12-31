import { Request, Response } from 'express';
import { SMSService } from './sms.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { ApiResponse } from '../../shared/utils/api-response';
import { SendSingleSMSSchema, SendBulkSameSMSSchema, SendBulkDifferentSMSSchema } from './sms.dto';
import { ZodError } from 'zod';

export class SMSController {
  private smsService = new SMSService();

  /**
   * Send single SMS (POST)
   */
  sendSingleSMS = asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = SendSingleSMSSchema.parse(req.body);
      const result = await this.smsService.sendSingleSMS(data);

      if (result.success) {
        return ApiResponse.success(res, result, 'SMS sent successfully');
      } else {
        return ApiResponse.error(res, result.message, 400);
      }
    } catch (error: any) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => {
          const field = issue.path.join('.');
          return field ? `${field}: ${issue.message}` : issue.message;
        }).join(', ');
        return ApiResponse.error(res, errorMessages, 400);
      }
      // Re-throw other errors to be handled by error middleware
      throw error;
    }
  });

  /**
   * Send single SMS (GET)
   */
  sendSingleSMSViaGet = asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = {
        to: req.query.to as string,
        msg: req.query.msg as string,
        senderID: req.query.senderID as string | undefined,
      };

      const validated = SendSingleSMSSchema.parse(data);
      const result = await this.smsService.sendSingleSMSViaGet(validated);

      if (result.success) {
        return ApiResponse.success(res, result, 'SMS sent successfully');
      } else {
        return ApiResponse.error(res, result.message, 400);
      }
    } catch (error: any) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => {
          const field = issue.path.join('.');
          return field ? `${field}: ${issue.message}` : issue.message;
        }).join(', ');
        return ApiResponse.error(res, errorMessages, 400);
      }
      // Re-throw other errors to be handled by error middleware
      throw error;
    }
  });

  /**
   * Send bulk SMS with same message
   */
  sendBulkSameSMS = asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = SendBulkSameSMSSchema.parse(req.body);
      const result = await this.smsService.sendBulkSameSMS(data);

      if (result.success) {
        return ApiResponse.success(res, result, 'Bulk SMS sent successfully');
      } else {
        return ApiResponse.error(res, result.message, 400);
      }
    } catch (error: any) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => {
          const field = issue.path.join('.');
          return field ? `${field}: ${issue.message}` : issue.message;
        }).join(', ');
        return ApiResponse.error(res, errorMessages, 400);
      }
      // Re-throw other errors to be handled by error middleware
      throw error;
    }
  });

  /**
   * Send bulk SMS with different messages
   */
  sendBulkDifferentSMS = asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = SendBulkDifferentSMSSchema.parse(req.body);
      const result = await this.smsService.sendBulkDifferentSMS(data);

      if (result.success) {
        return ApiResponse.success(res, result, 'Bulk different SMS sent successfully');
      } else {
        return ApiResponse.error(res, result.message, 400);
      }
    } catch (error: any) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => {
          const field = issue.path.join('.');
          return field ? `${field}: ${issue.message}` : issue.message;
        }).join(', ');
        return ApiResponse.error(res, errorMessages, 400);
      }
      // Re-throw other errors to be handled by error middleware
      throw error;
    }
  });

  /**
   * Check account balance
   */
  checkBalance = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.smsService.checkBalance();
    return ApiResponse.success(res, result, 'Balance retrieved successfully');
  });

  /**
   * Get SMS logs
   */
  getSMSLogs = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      type: req.query.type as any,
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      recipient: req.query.recipient as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await this.smsService.getSMSLogs(filters);
    return ApiResponse.success(res, result, 'SMS logs retrieved successfully');
  });

  /**
   * Get SMS statistics
   */
  getSMSStats = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const result = await this.smsService.getSMSStats(filters);
    return ApiResponse.success(res, result, 'SMS statistics retrieved successfully');
  });
}

