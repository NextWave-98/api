import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';

const notificationService = new NotificationService();

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.createNotification(req.body);
  ApiResponse.success(res, result, 'Notification created successfully', 201);
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.getNotifications(req.query as any);
  ApiResponse.success(res, result, 'Notifications retrieved successfully');
});

export const getNotificationById = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.getNotificationById(req.params.id);
  ApiResponse.success(res, result, 'Notification retrieved successfully');
});

export const updateNotificationStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.updateNotificationStatus(req.params.id, req.body);
  ApiResponse.success(res, result, 'Notification status updated successfully');
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.deleteNotification(req.params.id);
  ApiResponse.success(res, result, 'Notification deleted successfully');
});

export const getNotificationStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.getNotificationStats();
  ApiResponse.success(res, result, 'Notification statistics retrieved successfully');
});

export const sendJobNotification = asyncHandler(async (req: Request, res: Response) => {
  const { jobSheetId, type, message } = req.body;
  const result = await notificationService.sendJobNotification(jobSheetId, type, message);
  ApiResponse.success(res, result, 'Job notification sent successfully', 201);
});

// =============================================
// NOTIFICATION SETTINGS ENDPOINTS
// =============================================

export const getNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.getNotificationSettings();
  ApiResponse.success(res, result, 'Notification settings retrieved successfully');
});

export const getNotificationSettingByType = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.getNotificationSettingByType(req.params.type);
  ApiResponse.success(res, result, 'Notification setting retrieved successfully');
});

export const updateNotificationSetting = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.updateNotificationSetting(req.params.type, req.body);
  ApiResponse.success(res, result, 'Notification setting updated successfully');
});

export const bulkUpdateNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
  const { settings } = req.body;
  const result = await notificationService.bulkUpdateNotificationSettings(settings);
  ApiResponse.success(res, result, 'Notification settings updated successfully');
});

// =============================================
// RECIPIENT MANAGEMENT ENDPOINTS
// =============================================

export const getAdminRecipients = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.getAdminRecipients();
  ApiResponse.success(res, result, 'Admin recipients retrieved successfully');
});

export const getManagerRecipients = asyncHandler(async (req: Request, res: Response) => {
  const { locationId } = req.query;
  const result = await notificationService.getManagerRecipients(locationId as string);
  ApiResponse.success(res, result, 'Manager recipients retrieved successfully');
});

export const getRecipientsByRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.params;
  const { locationId } = req.query;
  const result = await notificationService.getRecipientsByRole(role, locationId as string);
  ApiResponse.success(res, result, 'Recipients retrieved successfully');
});

// =============================================
// NOTIFICATION TESTING
// =============================================

export const sendTestNotification = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.sendTestNotification(req.body);
  ApiResponse.success(res, result, 'Test notification sent successfully', 201);
});

// =============================================
// USER-SPECIFIC NOTIFICATIONS
// =============================================

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  
  console.log('📱 GET MY NOTIFICATIONS - Request:', {
    userId,
    query: req.query,
    user: req.user,
  });

  if (!userId) {
    console.error('❌ User not authenticated - missing userId');
    return ApiResponse.error(res, 'User not authenticated', 401);
  }

  const result = await notificationService.getNotificationsByUserId(userId, req.query as any);
  
  console.log('✅ Returning notifications:', {
    total: result.pagination.total,
    count: result.data.length,
  });

  ApiResponse.success(res, result, 'User notifications retrieved successfully');
});

export const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.markAsRead(req.params.id);
  ApiResponse.success(res, result, 'Notification marked as read');
});

export const retryFailedNotification = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.retryNotification(req.params.id);
  ApiResponse.success(res, result, 'Notification retry initiated');
});

