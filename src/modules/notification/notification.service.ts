import { AppError } from '../../shared/utils/app-error';
import {
  CreateNotificationDTO,
  UpdateNotificationStatusDTO,
  NotificationQueryDTO,
} from './notification.dto';
import {
  Notification,
  NotificationSetting,
  Customer,
  JobSheet,
  Sale,
  ProductReturn,
  User,
  Role,
  Device,
  Location,
} from '../../models';
import { Op, fn, col } from 'sequelize';
import { sequelize } from '../../config/database';

export class NotificationService {
  async createNotification(data: CreateNotificationDTO) {
    // Validate customer if provided
    if (data.customerId) {
      const customer = await Customer.findByPk(data.customerId);
      if (!customer) {
        throw new AppError(404, 'Customer not found');
      }
    }

    // Validate job sheet if provided
    if (data.jobSheetId) {
      const jobSheet = await JobSheet.findByPk(data.jobSheetId);
      if (!jobSheet) {
        throw new AppError(404, 'Job sheet not found');
      }
    }

    // Validate sale if provided
    if (data.saleId) {
      const sale = await Sale.findByPk(data.saleId);
      if (!sale) {
        throw new AppError(404, 'Sale not found');
      }
    }

    // Validate product return if provided
    if (data.productReturnId) {
      const productReturn = await ProductReturn.findByPk(data.productReturnId);
      if (!productReturn) {
        throw new AppError(404, 'Product return not found');
      }
    }

    // Validate recipient user if provided
    if (data.recipientUserId) {
      const user = await User.findByPk(data.recipientUserId);
      if (!user) {
        throw new AppError(404, 'Recipient user not found');
      }
    }

    // Validate parent notification if provided
    if (data.parentNotificationId) {
      const parentNotification = await Notification.findByPk(data.parentNotificationId);
      if (!parentNotification) {
        throw new AppError(404, 'Parent notification not found');
      }
    }

    const notification = await Notification.create({
      type: data.type,
      eventType: data.eventType || undefined,
      title: data.title,
      message: data.message,
      method: data.method,
      recipient: data.recipient,
      recipientType: data.recipientType || 'CUSTOMER',
      recipientUserId: data.recipientUserId || undefined,
      recipientRole: data.recipientRole || undefined,
      priority: data.priority || 'MEDIUM',
      workflowStage: data.workflowStage || undefined,
      status: 'PENDING',
      
      // Foreign keys - explicitly handle null/undefined
      customerId: data.customerId || undefined,
      jobSheetId: data.jobSheetId || undefined,
      saleId: data.saleId || undefined,
      productReturnId: data.productReturnId || undefined,
      parentNotificationId: data.parentNotificationId || undefined,
      
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    });

    // Note: Notification associations may need to be set up in models/index.ts
    // For now, return notification without includes if associations are not configured
    return notification.toJSON();
  }

  async getNotifications(query: NotificationQueryDTO) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.jobSheetId) {
      where.jobSheetId = query.jobSheetId;
    }

    if (query.saleId) {
      where.saleId = query.saleId;
    }

    if (query.productReturnId) {
      where.productReturnId = query.productReturnId;
    }

    if (query.recipientUserId) {
      where.recipientUserId = query.recipientUserId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.eventType) {
      where.eventType = query.eventType;
    }

    if (query.recipientType) {
      where.recipientType = query.recipientType;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.method) {
      where.method = query.method;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.workflowStage) {
      where.workflowStage = query.workflowStage;
    }

    const [notifications, total] = await Promise.all([
      Notification.findAll({
        where,
        offset: skip,
        limit,
        order: [['createdAt', 'DESC']],
        // Note: Includes commented out until associations are set up
        // include: [
        //   { model: Customer, as: 'customer', attributes: ['id', 'customerId', 'name', 'phone'] },
        //   { model: JobSheet, as: 'jobSheet', attributes: ['id', 'jobNumber', 'status'] },
        //   { model: Sale, as: 'sale', attributes: ['id', 'saleNumber', 'totalAmount', 'status'] },
        //   { model: ProductReturn, as: 'productReturn', attributes: ['id', 'returnNumber', 'status', 'productId'] },
        //   { model: User, as: 'recipientUser', attributes: ['id', 'name', 'email'] },
        //   { model: Notification, as: 'parentNotification', attributes: ['id', 'type', 'workflowStage'] },
        // ]
      }),
      Notification.count({ where }),
    ]);

    return {
      notifications: notifications.map(n => n.toJSON()),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNotificationById(id: string) {
    const notification = await Notification.findByPk(id, {
      // Note: Includes commented out until associations are set up
      // include: [
      //   { model: Customer, as: 'customer' },
      //   { model: JobSheet, as: 'jobSheet', include: [{ model: Device, as: 'device' }] }
      // ]
    });

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    return notification.toJSON();
  }

  async updateNotificationStatus(id: string, data: UpdateNotificationStatusDTO) {
    const notification = await Notification.findByPk(id);

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    const updateData: any = { status: data.status };

    if (data.status === 'SENT' || data.status === 'DELIVERED') {
      updateData.sentAt = new Date();
    }

    await Notification.update(updateData, {
      where: { id }
    });

    const updated = await Notification.findByPk(id);
    return updated?.toJSON();
  }

  async deleteNotification(id: string) {
    const notification = await Notification.findByPk(id);

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    await Notification.destroy({
      where: { id }
    });

    return { message: 'Notification deleted successfully' };
  }

  async getNotificationStats() {
    const [total, pending, sent, failed, byType, byMethod] = await Promise.all([
      Notification.count(),
      Notification.count({ where: { status: 'PENDING' } }),
      Notification.count({ where: { status: 'SENT' } }),
      Notification.count({ where: { status: 'FAILED' } }),
      Notification.findAll({
        attributes: [
          'type',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['type'],
        raw: true
      }),
      Notification.findAll({
        attributes: [
          'method',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['method'],
        raw: true
      }),
    ]);

    const typeStats = (byType as any[]).reduce((acc: any, item: any) => {
      acc[item.type] = parseInt(item.count as string);
      return acc;
    }, {});

    const methodStats = (byMethod as any[]).reduce((acc: any, item: any) => {
      acc[item.method] = parseInt(item.count as string);
      return acc;
    }, {});

    return {
      total,
      pending,
      sent,
      failed,
      byType: typeStats,
      byMethod: methodStats,
    };
  }

  async sendJobNotification(
    jobSheetId: string,
    type: string,
    customMessage?: string
  ) {
    const jobSheet = await JobSheet.findByPk(jobSheetId, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Device, as: 'device' }
      ]
    });

    if (!jobSheet) {
      throw new AppError(404, 'Job sheet not found');
    }

    let title = '';
    let message = customMessage || '';
    const jobSheetData = jobSheet.toJSON() as any;

    switch (type) {
      case 'JOB_CREATED':
        title = 'Job Sheet Created';
        message =
          message ||
          `Your repair job ${jobSheetData.jobNumber} for ${jobSheetData.device?.brand} ${jobSheetData.device?.model} has been created.`;
        break;
      case 'JOB_STARTED':
        title = 'Repair Started';
        message =
          message ||
          `Work on your device (${jobSheetData.jobNumber}) has started.`;
        break;
      case 'JOB_COMPLETED':
        title = 'Repair Completed';
        message =
          message ||
          `Your device repair (${jobSheetData.jobNumber}) is now completed.`;
        break;
      case 'READY_PICKUP':
        title = 'Ready for Pickup';
        message =
          message ||
          `Your device (${jobSheetData.jobNumber}) is ready for pickup!`;
        break;
      default:
        title = 'Job Update';
    }

    const notification = await this.createNotification({
      customerId: jobSheetData.customerId,
      jobSheetId: jobSheetData.id,
      type: type as any,
      title,
      message,
      method: 'SMS',
      recipient: jobSheetData.customer?.phone || '',
      recipientType: 'CUSTOMER',
      priority: 'MEDIUM',
    });

    return notification;
  }

  /**
   * Get failed notifications that need retry
   */
  async getFailedNotifications(maxRetries: number = 3) {
    return await Notification.findAll({
      where: {
        status: 'FAILED',
        retryCount: {
          [Op.lt]: maxRetries,
        },
      },
      order: [['updatedAt', 'ASC']], // Using updatedAt instead of lastRetryAt
      limit: 50,
    }).then(notifications => notifications.map(n => n.toJSON()));
  }

  /**
   * Update notification retry information
   */
  async updateRetryInfo(
    id: string,
    retryCount: number,
    failureReason?: string
  ) {
    await Notification.update({
      retryCount,
      updatedAt: new Date(), // Using updatedAt instead of lastRetryAt
      errorMessage: failureReason,
    }, {
      where: { id }
    });

    return await Notification.findByPk(id).then(n => n?.toJSON());
  }

  /**
   * Get notifications by workflow stage
   */
  async getNotificationsByWorkflow(
    workflowStage: string,
    saleId?: string,
    productReturnId?: string,
    jobSheetId?: string
  ) {
    const where: any = { workflowStage: workflowStage };

    // Note: These fields may need to be added to Notification model or use referenceId/referenceType
    if (saleId) where.saleId = saleId;
    if (productReturnId) where.productReturnId = productReturnId;
    if (jobSheetId) where.jobSheetId = jobSheetId;

    return await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      // include: [
      //   { model: User, as: 'recipientUser', attributes: ['id', 'name', 'email'] }
      // ]
    }).then(notifications => notifications.map(n => n.toJSON()));
  }

  /**
   * Get notification statistics with new fields
   */
  async getEnhancedStats() {
    const [
      total,
      pending,
      sent,
      failed,
      byType,
      byMethod,
      byRecipientType,
      byPriority,
      byEventType,
    ] = await Promise.all([
      Notification.count(),
      Notification.count({ where: { status: 'PENDING' } }),
      Notification.count({ where: { status: 'SENT' } }),
      Notification.count({ where: { status: 'FAILED' } }),
      Notification.findAll({
        attributes: [
          'type',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['type'],
        raw: true
      }),
      Notification.findAll({
        attributes: [
          'method',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['method'],
        raw: true
      }),
      Notification.findAll({
        attributes: [
          'recipientType',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['recipientType'],
        raw: true
      }),
      Notification.findAll({
        attributes: [
          'priority',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['priority'],
        raw: true
      }),
      Notification.findAll({
        attributes: [
          'eventType',
          [fn('COUNT', col('id')), 'count']
        ],
        where: {
          eventType: {
            [Op.ne]: null,
          },
        },
        group: ['eventType'],
        raw: true
      }),
    ]);

    return {
      total,
      statusCounts: {
        pending,
        sent,
        failed,
      },
      byType: (byType as any[]).reduce((acc: any, item: any) => {
        acc[item.type] = parseInt(item.count as string);
        return acc;
      }, {}),
      byMethod: (byMethod as any[]).reduce((acc: any, item: any) => {
        acc[item.method] = parseInt(item.count as string);
        return acc;
      }, {}),
      byRecipientType: (byRecipientType as any[]).reduce((acc: any, item: any) => {
        acc[item.recipientType] = parseInt(item.count as string);
        return acc;
      }, {}),
      byPriority: (byPriority as any[]).reduce((acc: any, item: any) => {
        acc[item.priority] = parseInt(item.count as string);
        return acc;
      }, {}),
      byEventType: (byEventType as any[]).reduce((acc: any, item: any) => {
        if (item.eventType) {
          acc[item.eventType] = parseInt(item.count as string);
        }
        return acc;
      }, {}),
    };
  }

  // =============================================
  // NOTIFICATION SETTINGS METHODS
  // =============================================

  async getNotificationSettings() {
    const settings = await NotificationSetting.findAll({
      order: [['notificationType', 'ASC']],
    }).then(s => s.map(setting => setting.toJSON()));

    // Group settings by category for better organization
    const categorized = {
      jobSheetNotifications: settings.filter(s => s.notificationType.startsWith('JOB_')),
      salesNotifications: settings.filter(s => s.notificationType.startsWith('SALE_')),
      returnNotifications: settings.filter(s => s.notificationType.startsWith('RETURN_')),
      addonRequestNotifications: settings.filter(s => s.notificationType.startsWith('ADDON_REQUEST_')),
      generalNotifications: settings.filter(s => 
        !s.notificationType.startsWith('JOB_') && 
        !s.notificationType.startsWith('SALE_') && 
        !s.notificationType.startsWith('RETURN_') &&
        !s.notificationType.startsWith('ADDON_REQUEST_')
      ),
    };

    return {
      settings,
      categorized,
      summary: {
        total: settings.length,
        enabled: settings.filter(s => s.enabled).length,
        disabled: settings.filter(s => !s.enabled).length,
        smsEnabled: settings.filter(s => s.smsEnabled).length,
        emailEnabled: settings.filter(s => s.emailEnabled).length,
        whatsappEnabled: settings.filter(s => s.whatsappEnabled).length,
      },
    };
  }

  async getNotificationSettingByType(notificationType: string) {
    let setting = await NotificationSetting.findOne({
      where: { notificationType },
    });
    
    if (!setting) {
      console.log(`⚠️ No setting found for ${notificationType}, creating default...`);
      
      // Set type-specific defaults
      let adminEnabled = false;
      let managerEnabled = false;
      let customerEnabled = true;
      let staffEnabled = false;
      
      // Enable admin notifications for important job sheet events
      if (['JOB_CREATED', 'JOB_COMPLETED', 'JOB_CANCELLED', 'JOB_PRICE_UPDATED'].includes(notificationType)) {
        adminEnabled = true;
      }
      
      // Enable manager notifications for job assignments and completions
      if (['JOB_ASSIGNED', 'JOB_COMPLETED', 'JOB_CANCELLED'].includes(notificationType)) {
        managerEnabled = true;
      }
      
      // Enable staff notifications for assignments
      if (['JOB_ASSIGNED'].includes(notificationType)) {
        staffEnabled = true;
      }
      
      // Create default setting if not found
      setting = await NotificationSetting.create({
        notificationType,
        enabled: true,
        adminEnabled,
        managerEnabled,
        customerEnabled,
        staffEnabled,
        smsEnabled: true,
        emailEnabled: false,
        whatsappEnabled: false,
        priority: 'MEDIUM',
        autoSend: true,
      });

      console.log(`✅ Created default setting for ${notificationType}`);
    }
    
    return setting.toJSON();
  }

  async updateNotificationSetting(notificationType: string, data: any) {
    const [setting] = await NotificationSetting.upsert({
      notificationType,
      priority: 'MEDIUM', // Default priority
      ...data,
    }, {
      returning: true
    });
    return setting.toJSON();
  }

  async bulkUpdateNotificationSettings(settings: Array<{ notificationType: string; updates: any }>) {
    const results = await Promise.all(
      settings.map(({ notificationType, updates }) =>
        this.updateNotificationSetting(notificationType, updates)
      )
    );
    return results;
  }

  // =============================================
  // RECIPIENT MANAGEMENT METHODS
  // =============================================

  async getAdminRecipients() {
    const adminRole = await Role.findOne({
      where: { name: 'ADMIN' },
    });

    if (!adminRole) {
      return [];
    }

    const users = await User.findAll({
      where: {
        roleId: adminRole.id,
        isActive: true,
      },
      // include: [{ model: Staff, as: 'staff' }] // Commented until associations are set up
    });

    return users.map(user => {
      const userData = user.toJSON() as any;
      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.staff?.phoneNumber || null,
        role: 'ADMIN',
      };
    });
  }

  async getManagerRecipients(locationId?: string) {
    const managerRole = await Role.findOne({
      where: { name: 'MANAGER' },
    });

    if (!managerRole) {
      return [];
    }

    const where: any = {
      roleId: managerRole.id,
      isActive: true,
    };
    if (locationId) where.locationId = locationId;

    const users = await User.findAll({
      where,
      // include: [
      //   { model: Staff, as: 'staff' },
      //   { model: Location, as: 'location' }
      // ]
    });

    return users.map(user => {
      const userData = user.toJSON() as any;
      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.staff?.phoneNumber || null,
        role: 'MANAGER',
        locationId: userData.locationId,
        locationName: userData.location?.name || null,
      };
    });
  }

  async getRecipientsByRole(roleName: string, locationId?: string) {
    const role = await Role.findOne({
      where: { name: roleName.toUpperCase() },
    });

    if (!role) {
      throw new AppError(404, `Role '${roleName}' not found`);
    }

    const where: any = {
      roleId: role.id,
      isActive: true,
    };
    if (locationId) where.locationId = locationId;

    const users = await User.findAll({
      where,
      // include: [
      //   { model: Staff, as: 'staff' },
      //   { model: Location, as: 'location' }
      // ]
    });

    return users.map(user => {
      const userData = user.toJSON() as any;
      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.staff?.phoneNumber || null,
        role: roleName.toUpperCase(),
        locationId: userData.locationId,
        locationName: userData.location?.name || null,
      };
    });
  }

  // =============================================
  // TESTING & UTILITY METHODS
  // =============================================

  async sendTestNotification(data: {
    type: string;
    recipientType: string;
    recipient: string;
    method: string;
  }) {
    const notification = await this.createNotification({
      type: data.type as any,
      method: data.method as any,
      recipientType: data.recipientType as any,
      recipient: data.recipient,
      title: 'Test Notification',
      message: 'This is a test notification from the system.',
      priority: 'LOW',
      eventType: 'CREATE',
      metadata: { test: true },
    });

    return {
      success: true,
      message: 'Test notification sent',
      notification,
    };
  }

  async getNotificationsByUserId(userId: string, filters?: NotificationQueryDTO) {
    const page = Number(filters?.page) || 1;
    const limit = Number(filters?.limit) || 10;
    const skip = (page - 1) * limit;

    console.log('🔍 Getting notifications for user:', {
      userId,
      filters,
      page,
      limit,
    });

    // Build where clause
    const where: any = {
      recipientUserId: userId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.recipientType) {
      where.recipientType = filters.recipientType;
    }

    console.log('📊 Query WHERE clause:', JSON.stringify(where, null, 2));

    const [notifications, total] = await Promise.all([
      Notification.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset: skip,
        // include: [
        //   { model: Customer, as: 'customer', attributes: ['id', 'name'] },
        //   { model: JobSheet, as: 'jobSheet', attributes: ['id', 'jobNumber'] },
        //   { model: Sale, as: 'sale', attributes: ['id', 'saleNumber'] },
        //   { model: ProductReturn, as: 'productReturn', attributes: ['id', 'returnNumber'] },
        // ]
      }),
      Notification.count({ where }),
    ]);

    console.log('✅ Notifications found:', {
      total,
      returned: notifications.length,
      hasRecipientUserId: notifications.map(n => ({
        id: n.id,
        recipientUserId: n.recipientUserId,
        type: n.type,
        status: n.status,
      })),
    });

    return {
      data: notifications.map(n => n.toJSON()),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(notificationId: string) {
    await Notification.update({
      status: 'DELIVERED',
      sentAt: new Date(),
      read: true,
      readAt: new Date(),
    }, {
      where: { id: notificationId }
    });

    const notification = await Notification.findByPk(notificationId);
    return notification?.toJSON();
  }

  async retryNotification(notificationId: string) {
    const notification = await Notification.findByPk(notificationId);

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    if (notification.status !== 'FAILED') {
      throw new AppError(400, 'Only failed notifications can be retried');
    }

    // Update notification to retry
    await Notification.update({
      status: 'PENDING',
      retryCount: (notification.retryCount || 0) + 1,
      errorMessage: null,
    }, {
      where: { id: notificationId }
    });

    const updated = await Notification.findByPk(notificationId);
    return {
      success: true,
      message: 'Notification queued for retry',
      notification: updated?.toJSON(),
    };
  }
}

