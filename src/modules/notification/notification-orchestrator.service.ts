/**
 * Notification Orchestrator Service
 * Centralized notification management with admin/manager workflow support
 */

import { NotificationType, RecipientType, NotificationPriority, EventType, NotificationStatus } from '../../enums';
import { renderNotification, TemplateContext } from './notification-templates';
import { NotificationService } from './notification.service';
import { SMSService } from '../sms/sms.service';
import {
  Notification,
  Role,
  User,
  Customer,
  Staff,
} from '../../models';

export interface NotificationRecipient {
  recipientType: RecipientType;
  recipient: string; // phone or email
  recipientUserId?: string;
  recipientRole?: string;
}

export interface CreateNotificationOptions {
  type: NotificationType;
  eventType?: EventType;
  priority?: NotificationPriority;
  customerId?: string;
  jobSheetId?: string;
  saleId?: string;
  productReturnId?: string;
  context: TemplateContext;
  workflowStage?: string;
  parentNotificationId?: string;
  metadata?: any;
}

export class NotificationOrchestrator {
  private notificationService: NotificationService;
  private smsService: SMSService;
  
  constructor() {
    this.notificationService = new NotificationService();
    this.smsService = new SMSService();
  }
  
  // ===========================================
  // HELPER METHODS - Get Users by Role
  // ===========================================
  
  /**
   * Get all admin users
   */
  private async getAdminUsers(): Promise<Array<{ id: string; name: string; phone?: string }>> {
    const adminRole = await Role.findOne({
      where: { name: 'ADMIN' },
    });
    
    if (!adminRole) {
      console.warn('Admin role not found in database');
      return [];
    }
    
    const users = await User.findAll({
      where: {
        roleId: adminRole.id,
        isActive: true,
      },
      include: [{ model: Staff, as: 'staff' }]
    });
    
    return users.map(user => {
      const userData = user.toJSON() as any;
      return {
        id: userData.id,
        name: userData.name,
        phone: userData.staff?.phoneNumber || undefined,
      };
    }).filter(u => u.phone); // Only return users with phone numbers
  }
  
  /**
   * Get all manager users (optionally filtered by location)
   */
  private async getManagerUsers(locationId?: string): Promise<Array<{ id: string; name: string; phone?: string }>> {
    const managerRole = await Role.findOne({
      where: { name: 'MANAGER' },
    });
    
    if (!managerRole) {
      console.warn('Manager role not found in database');
      return [];
    }
    
    const where: any = {
      roleId: managerRole.id,
      isActive: true,
    };
    if (locationId) where.locationId = locationId;
    
    const users = await User.findAll({
      where,
      include: [{ model: Staff, as: 'staff' }]
    });
    
    return users.map(user => {
      const userData = user.toJSON() as any;
      return {
        id: userData.id,
        name: userData.name,
        phone: userData.staff?.phoneNumber || undefined,
      };
    }).filter(u => u.phone);
  }
  
  /**
   * Get technician users (optionally filtered by location)
   */
  private async getTechnicianUsers(locationId?: string): Promise<Array<{ id: string; name: string; phone?: string }>> {
    const techRole = await Role.findOne({
      where: { name: 'TECHNICIAN' },
    });
    
    if (!techRole) {
      console.warn('Technician role not found in database');
      return [];
    }
    
    const where: any = {
      roleId: techRole.id,
      isActive: true,
    };
    if (locationId) where.locationId = locationId;
    
    const users = await User.findAll({
      where,
      include: [{ model: Staff, as: 'staff' }]
    });
    
    return users.map(user => {
      const userData = user.toJSON() as any;
      return {
        id: userData.id,
        name: userData.name,
        phone: userData.staff?.phoneNumber || undefined,
      };
    }).filter(u => u.phone);
  }
  
  // ===========================================
  // CORE ORCHESTRATION METHODS
  // ===========================================
  
  /**
   * Check notification settings and filter recipients based on settings
   * @returns Filtered recipients, settings, and whether to send notifications
   */
  private async checkNotificationSettings(
    notificationType: NotificationType,
    recipients: NotificationRecipient[]
  ): Promise<{
    filteredRecipients: NotificationRecipient[];
    settings: any;
    shouldSend: boolean;
  }> {
    try {
      // Get settings for this notification type
      const settings = await this.notificationService.getNotificationSettingByType(notificationType);
      
      // If notification is disabled entirely, don't send to anyone
      if (!settings.enabled) {
        console.log(`❌ Notification ${notificationType} is disabled globally`);
        return { filteredRecipients: [], settings, shouldSend: false };
      }
      
      // Filter recipients based on settings
      const filteredRecipients = recipients.filter(recipient => {
        switch (recipient.recipientType) {
          case 'CUSTOMER':
            if (!settings.customerEnabled) {
              console.log(`⏭️  Skipping CUSTOMER notification for ${notificationType} (customerEnabled=false)`);
              return false;
            }
            return true;
            
          case 'ADMIN':
            if (!settings.adminEnabled) {
              console.log(`⏭️  Skipping ADMIN notification for ${notificationType} (adminEnabled=false)`);
              return false;
            }
            return true;
            
          case 'MANAGER':
            if (!settings.managerEnabled) {
              console.log(`⏭️  Skipping MANAGER notification for ${notificationType} (managerEnabled=false)`);
              return false;
            }
            return true;
            
          case 'STAFF':
            if (!settings.staffEnabled) {
              console.log(`⏭️  Skipping STAFF notification for ${notificationType} (staffEnabled=false)`);
              return false;
            }
            return true;
            
          default:
            return true;
        }
      });
      
      const shouldSend = filteredRecipients.length > 0;
      
      if (shouldSend) {
        console.log(`✅ ${notificationType}: Sending to ${filteredRecipients.length}/${recipients.length} recipients`);
      } else {
        console.log(`🚫 ${notificationType}: No recipients after filtering`);
      }
      
      return {
        filteredRecipients,
        settings,
        shouldSend
      };
    } catch (error) {
      console.error(`Error checking notification settings for ${notificationType}:`, error);
      // On error, allow notifications to proceed (fail-open for safety)
      return {
        filteredRecipients: recipients,
        settings: null,
        shouldSend: true
      };
    }
  }
  
  /**
   * Send notification to multiple recipients (with settings check)
   */
  private async sendToMultipleRecipients(
    recipients: NotificationRecipient[],
    options: CreateNotificationOptions
  ): Promise<void> {
    console.log('📤 sendToMultipleRecipients called with:', {
      type: options.type,
      recipientCount: recipients.length,
      recipients: recipients.map(r => ({ type: r.recipientType, phone: r.recipient }))
    });
    
    // Check settings before sending
    const { filteredRecipients, settings, shouldSend } = 
      await this.checkNotificationSettings(options.type, recipients);
    
    if (!shouldSend) {
      console.log(`🚫 No notifications will be sent for ${options.type} - all recipients filtered out or disabled`);
      return;
    }
    
    console.log(`📤 Sending ${options.type} to ${filteredRecipients.length} recipient(s)`);
    
    const promises = filteredRecipients.map(recipient => 
      this.createAndSendNotification({
        ...options,
        recipientType: recipient.recipientType,
        recipient: recipient.recipient,
        recipientUserId: recipient.recipientUserId,
        recipientRole: recipient.recipientRole,
      }, settings)
    );
    
    await Promise.allSettled(promises);
  }
  
  /**
   * Create and send a single notification (respecting channel and auto-send settings)
   */
  private async createAndSendNotification(
    options: CreateNotificationOptions & {
      recipientType: RecipientType;
      recipient: string;
      recipientUserId?: string;
      recipientRole?: string;
    },
    settings?: any
  ): Promise<void> {
    try {
      // Get settings if not provided
      if (!settings) {
        settings = await this.notificationService.getNotificationSettingByType(options.type);
      }
      
      // Check if SMS is enabled for this notification type
      if (!settings.smsEnabled) {
        console.log(`⏭️  SMS disabled for ${options.type}, skipping SMS send`);
        // TODO: Implement email/whatsapp fallback when those channels are ready
        return;
      }
      
      // Render template
      const { title, message } = renderNotification(
        options.type,
        options.recipientType,
        options.context,
        'sms'
      );
      
      // Use priority from settings if available, otherwise use provided priority
      const priority = settings.priority || options.priority || 'MEDIUM';
      
      // Create notification record
      const notification = await Notification.create({
        type: options.type,
        eventType: options.eventType,
        title,
        message,
        method: 'SMS',
        recipient: options.recipient,
        recipientType: options.recipientType,
        recipientUserId: options.recipientUserId,
        recipientRole: options.recipientRole,
        priority,
        workflowStage: options.workflowStage,
        parentNotificationId: options.parentNotificationId,
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
        customerId: options.customerId,
        jobSheetId: options.jobSheetId,
        saleId: options.saleId,
        productReturnId: options.productReturnId,
        status: 'PENDING',
      });
      
      // Only send if autoSend is enabled
      if (settings.autoSend) {
        await this.sendNotificationWithRetry(notification.id, message, options.recipient);
      } else {
        console.log(`⏸️  Auto-send disabled for ${options.type}, notification created but not sent (requires manual approval)`);
        // Notification stays in PENDING status for manual review/approval
      }
      
    } catch (error) {
      console.error('Error creating/sending notification:', error);
      throw error;
    }
  }
  
  /**
   * Send notification with retry logic
   */
  private async sendNotificationWithRetry(
    notificationId: string,
    message: string,
    recipient: string,
    retryCount: number = 0
  ): Promise<void> {
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s exponential backoff
    
    try {
      // Attempt to send SMS
      const smsResult = await this.smsService.sendSingleSMS({ to: recipient, msg: message });
      
      // Check if SMS was actually sent successfully
      if (smsResult.success) {
        // Update notification status to SENT
        await Notification.update({
          status: 'SENT',
          sentAt: new Date(),
          retryCount,
        }, {
          where: { id: notificationId }
        });
      } else {
        // SMS failed, treat as error
        throw new Error(smsResult.message || 'SMS sending failed');
      }
      
    } catch (error) {
      console.error(`SMS send failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
      
      // Update retry count
      await Notification.update({
        retryCount: retryCount + 1,
        updatedAt: new Date(), // Using updatedAt instead of lastRetryAt
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }, {
        where: { id: notificationId }
      });
      
      // Retry if not exceeded max attempts
      if (retryCount < MAX_RETRIES - 1) {
        const delay = RETRY_DELAYS[retryCount];
        console.log(`Retrying in ${delay}ms...`);
        
        setTimeout(() => {
          this.sendNotificationWithRetry(notificationId, message, recipient, retryCount + 1);
        }, delay);
      } else {
        // Mark as failed after max retries
        await Notification.update({
          status: 'FAILED',
          errorMessage: `Failed after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }, {
          where: { id: notificationId }
        });
      }
    }
  }
  
  // ===========================================
  // SALES NOTIFICATIONS
  // ===========================================
  
  /**
   * Send notifications for sale creation
   */
  async createSaleNotifications(
    saleId: string,
    customerId: string | null,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Customer notification (if customer exists)
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      
      if (customer?.phone) {
        recipients.push({
          recipientType: RecipientType.CUSTOMER,
          recipient: customer.phone,
        });
      }
    }
    
    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.SALE_CREATED,
      eventType: EventType.CREATE,
      priority: NotificationPriority.MEDIUM,
      saleId,
      customerId: customerId || undefined,
      context,
      workflowStage: 'initial',
    });

    // Check for High Value Sale
    const totalAmount = parseFloat(context.totalAmount || '0');
    if (totalAmount > 1000) {
       const highValueRecipients: NotificationRecipient[] = [];

       // Manager notifications
       const managers = await this.getManagerUsers(locationId);
       managers.forEach(manager => {
         highValueRecipients.push({
           recipientType: RecipientType.MANAGER,
           recipient: manager.phone!,
           recipientUserId: manager.id,
           recipientRole: 'MANAGER',
         });
       });

       // Admin notifications
       const admins = await this.getAdminUsers();
       admins.forEach(admin => {
         highValueRecipients.push({
           recipientType: RecipientType.ADMIN,
           recipient: admin.phone!,
           recipientUserId: admin.id,
           recipientRole: 'ADMIN',
         });
       });

       await this.sendToMultipleRecipients(highValueRecipients, {
         type: NotificationType.SALE_HIGH_VALUE,
         eventType: EventType.CREATE,
         priority: NotificationPriority.URGENT,
         saleId,
         customerId: customerId || undefined,
         context,
         workflowStage: 'high_value_alert',
       });
    }
  }
  
  /**
   * Send notifications for sale cancellation (hierarchical: Admin -> Manager)
   */
  async createSaleCancellationNotifications(
    saleId: string,
    customerId: string | null,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Customer notification
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      
      if (customer?.phone) {
        recipients.push({
          recipientType: RecipientType.CUSTOMER,
          recipient: customer.phone,
        });
      }
    }
    
    // Admin notifications (first stage)
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.SALE_CANCELLED,
      eventType: EventType.DELETE,
      priority: NotificationPriority.HIGH,
      saleId,
      customerId: customerId || undefined,
      context,
      workflowStage: 'admin_review',
    });
    
    // Manager notifications (second stage - requires approval)
    const managers = await this.getManagerUsers(locationId);
    const managerRecipients: NotificationRecipient[] = managers.map(manager => ({
      recipientType: RecipientType.MANAGER,
      recipient: manager.phone!,
      recipientUserId: manager.id,
      recipientRole: 'MANAGER',
    }));
    
    await this.sendToMultipleRecipients(managerRecipients, {
      type: NotificationType.SALE_CANCELLED,
      eventType: EventType.APPROVAL,
      priority: NotificationPriority.HIGH,
      saleId,
      customerId: customerId || undefined,
      context,
      workflowStage: 'manager_approval',
    });
  }
  
  /**
   * Send notifications for sale price change
   */
  async createSalePriceChangeNotifications(
    saleId: string,
    customerId: string | null,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    // Only admins get notified of price changes
    const admins = await this.getAdminUsers();
    const recipients: NotificationRecipient[] = admins.map(admin => ({
      recipientType: RecipientType.ADMIN,
      recipient: admin.phone!,
      recipientUserId: admin.id,
      recipientRole: 'ADMIN',
    }));
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.SALE_PRICE_CHANGED,
      eventType: EventType.PRICE_UPDATE,
      priority: NotificationPriority.HIGH,
      saleId,
      customerId: customerId || undefined,
      context,
      workflowStage: 'admin_review',
    });
  }
  
  // ===========================================
  // PRODUCT RETURN NOTIFICATIONS
  // ===========================================
  
  /**
   * Send notifications for return creation (Customer + Admin)
   */
  async createReturnNotifications(
    returnId: string,
    customerId: string | null,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Customer notification
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      
      if (customer?.phone) {
        recipients.push({
          recipientType: RecipientType.CUSTOMER,
          recipient: customer.phone,
        });
      }
    }
    
    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.RETURN_CREATED,
      eventType: EventType.CREATE,
      priority: NotificationPriority.MEDIUM,
      productReturnId: returnId,
      customerId: customerId || undefined,
      context,
      workflowStage: 'initial',
    });
  }
  
  /**
   * Send notifications for return inspection (Admin -> Manager)
   */
  async createReturnInspectionNotifications(
    returnId: string,
    customerId: string | null,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.RETURN_INSPECTED,
      eventType: EventType.STATUS_CHANGE,
      priority: NotificationPriority.HIGH,
      productReturnId: returnId,
      customerId: customerId || undefined,
      context,
      workflowStage: 'admin_review',
    });
    
    // Manager notifications (approval required)
    const managers = await this.getManagerUsers(locationId);
    const managerRecipients: NotificationRecipient[] = managers.map(manager => ({
      recipientType: RecipientType.MANAGER,
      recipient: manager.phone!,
      recipientUserId: manager.id,
      recipientRole: 'MANAGER',
    }));
    
    await this.sendToMultipleRecipients(managerRecipients, {
      type: NotificationType.RETURN_INSPECTED,
      eventType: EventType.APPROVAL,
      priority: NotificationPriority.HIGH,
      productReturnId: returnId,
      customerId: customerId || undefined,
      context,
      workflowStage: 'manager_approval',
    });
  }
  
  /**
   * Send notifications for return approval/rejection
   */
  async createReturnDecisionNotifications(
    returnId: string,
    customerId: string | null,
    locationId: string,
    context: TemplateContext,
    approved: boolean
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Customer notification
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      
      if (customer?.phone) {
        recipients.push({
          recipientType: RecipientType.CUSTOMER,
          recipient: customer.phone,
        });
      }
    }
    
    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    const notificationType = approved ? NotificationType.RETURN_APPROVED : NotificationType.RETURN_REJECTED;
    const eventType = approved ? EventType.APPROVAL : EventType.REJECTION;
    
    await this.sendToMultipleRecipients(recipients, {
      type: notificationType,
      eventType,
      priority: NotificationPriority.HIGH,
      productReturnId: returnId,
      customerId: customerId || undefined,
      context,
      workflowStage: 'decision_made',
    });
  }
  
  /**
   * Send notifications for return completion (cash refund processed)
   */
  async createReturnCompletionNotifications(
    returnId: string,
    customerId: string | null,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Customer notification
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      
      if (customer?.phone) {
        recipients.push({
          recipientType: RecipientType.CUSTOMER,
          recipient: customer.phone,
        });
      }
    }
    
    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.RETURN_COMPLETED,
      eventType: EventType.COMPLETION,
      priority: NotificationPriority.MEDIUM,
      productReturnId: returnId,
      customerId: customerId || undefined,
      context,
      workflowStage: 'completed',
    });
  }

  /**
   * Send notifications for return inspecting (Customer + Admin)
   */
  async createReturnInspectingNotifications(
    returnId: string,
    customerId: string | null,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Customer notification
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      
      if (customer?.phone) {
        recipients.push({
          recipientType: RecipientType.CUSTOMER,
          recipient: customer.phone,
        });
      }
    }
    
    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.RETURN_INSPECTED,
      eventType: EventType.STATUS_CHANGE,
      priority: NotificationPriority.MEDIUM,
      productReturnId: returnId,
      customerId: customerId || undefined,
      context,
      workflowStage: 'inspecting',
    });
  }

  /**
   * Send notifications for return cancellation
   */
  async createReturnCancellationNotifications(
    returnId: string,
    customerId: string | null,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Customer notification
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      
      if (customer?.phone) {
        recipients.push({
          recipientType: RecipientType.CUSTOMER,
          recipient: customer.phone,
        });
      }
    }

    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.RETURN_CANCELLED,
      eventType: EventType.DELETE,
      priority: NotificationPriority.HIGH,
      productReturnId: returnId,
      customerId: customerId || undefined,
      context,
      workflowStage: 'cancelled',
    });
  }
  
  // ===========================================
  // JOB SHEET NOTIFICATIONS
  // ===========================================
  
  /**
   * Send notifications for job sheet creation
   */
  async createJobSheetNotifications(
    jobSheetId: string,
    customerId: string,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Customer notification
    const customer = await Customer.findByPk(customerId);
    
    if (customer?.phone) {
      recipients.push({
        recipientType: RecipientType.CUSTOMER,
        recipient: customer.phone,
      });
    }
    
    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.JOB_CREATED,
      eventType: EventType.CREATE,
      priority: NotificationPriority.MEDIUM,
      jobSheetId,
      customerId,
      context,
      workflowStage: 'initial',
    });
  }
  
  /**
   * Send notifications for job assignment
   */
  async createJobAssignmentNotifications(
    jobSheetId: string,
    customerId: string,
    technicianId: string,
    context: TemplateContext
  ): Promise<void> {
    const technician = await User.findByPk(technicianId, {
      include: [{ model: Staff, as: 'staff' }]
    });
    
    const techData = technician?.toJSON() as any;
    if (!techData?.staff?.phoneNumber) {
      console.warn('Technician phone not found for job assignment notification');
      return;
    }
    
    await this.createAndSendNotification({
      type: NotificationType.JOB_ASSIGNED,
      eventType: EventType.ASSIGNMENT,
      priority: NotificationPriority.HIGH,
      jobSheetId,
      customerId,
      context,
      recipientType: RecipientType.TECHNICIAN,
      recipient: techData.staff.phoneNumber,
      recipientUserId: techData.id,
      recipientRole: 'TECHNICIAN',
      workflowStage: 'assigned',
    });
  }
  
  /**
   * Send notifications for job completion
   */
  async createJobCompletionNotifications(
    jobSheetId: string,
    customerId: string,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    console.log('📞 createJobCompletionNotifications called for jobSheetId:', jobSheetId);
    const recipients: NotificationRecipient[] = [];
    
    // Customer notification
    const customer = await Customer.findByPk(customerId);
    
    if (customer?.phone) {
      recipients.push({
        recipientType: RecipientType.CUSTOMER,
        recipient: customer.phone,
      });
    }
    
    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.JOB_COMPLETED,
      eventType: EventType.STATUS_CHANGE,
      priority: NotificationPriority.HIGH,
      jobSheetId,
      customerId,
      context,
      workflowStage: 'completed',
    });
  }

  /**
   * Send notifications for job diagnosed
   */
  async createJobDiagnosedNotifications(
    jobSheetId: string,
    customerId: string,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    const customer = await Customer.findByPk(customerId);
    
    if (customer?.phone) {
      recipients.push({
        recipientType: RecipientType.CUSTOMER,
        recipient: customer.phone,
      });
    }
    
    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.JOB_DIAGNOSED,
      eventType: EventType.STATUS_CHANGE,
      priority: NotificationPriority.MEDIUM,
      jobSheetId,
      customerId,
      context,
      workflowStage: 'diagnosed',
    });
  }

  /**
   * Send notifications for job repairing
   */
  async createJobRepairingNotifications(
    jobSheetId: string,
    customerId: string,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Customer notification
    const customer = await Customer.findByPk(customerId);
    
    if (customer?.phone) {
      recipients.push({
        recipientType: RecipientType.CUSTOMER,
        recipient: customer.phone,
      });
    }
    
    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.JOB_REPAIRING,
      eventType: EventType.STATUS_CHANGE,
      priority: NotificationPriority.LOW,
      jobSheetId,
      customerId,
      context,
      workflowStage: 'repairing',
    });
  }

  /**
   * Send notifications for job ready for pickup
   */
  async createJobReadyPickupNotifications(
    jobSheetId: string,
    customerId: string,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    const customer = await Customer.findByPk(customerId);
    
    if (customer?.phone) {
      recipients.push({
        recipientType: RecipientType.CUSTOMER,
        recipient: customer.phone,
      });
    }
    
    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.JOB_READY_PICKUP,
      eventType: EventType.STATUS_CHANGE,
      priority: NotificationPriority.HIGH,
      jobSheetId,
      customerId,
      context,
      workflowStage: 'ready_pickup',
    });
  }

  /**
   * Send notifications for job delivered
   */
  async createJobDeliveredNotifications(
    jobSheetId: string,
    customerId: string,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    const customer = await Customer.findByPk(customerId);
    
    if (customer?.phone) {
      recipients.push({
        recipientType: RecipientType.CUSTOMER,
        recipient: customer.phone,
      });
    }
    
    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.JOB_DELIVERED,
      eventType: EventType.STATUS_CHANGE,
      priority: NotificationPriority.HIGH,
      jobSheetId,
      customerId,
      context,
      workflowStage: 'delivered',
    });
  }

  /**
   * Send notifications for job cancelled
   */
  async createJobCancellationNotifications(
    jobSheetId: string,
    customerId: string,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    const customer = await Customer.findByPk(customerId);
    
    if (customer?.phone) {
      recipients.push({
        recipientType: RecipientType.CUSTOMER,
        recipient: customer.phone,
      });
    }

    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.JOB_CANCELLED,
      eventType: EventType.DELETE,
      priority: NotificationPriority.HIGH,
      jobSheetId,
      customerId,
      context,
      workflowStage: 'cancelled',
    });
  }

  /**
   * Send notifications for job price update
   */
  async createJobPriceUpdateNotifications(
    jobSheetId: string,
    customerId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    const customer = await Customer.findByPk(customerId);
    
    if (customer?.phone) {
      recipients.push({
        recipientType: RecipientType.CUSTOMER,
        recipient: customer.phone,
      });
    }
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.JOB_PRICE_UPDATED,
      eventType: EventType.PRICE_UPDATE,
      priority: NotificationPriority.HIGH,
      jobSheetId,
      customerId,
      context,
      workflowStage: 'price_update',
    });
  }

  // ===========================================
  // ADDON REQUEST NOTIFICATIONS
  // ===========================================

  /**
   * Send notifications for addon request created
   */
  async createAddonRequestNotifications(
    addonRequestId: string,
    locationId: string,
    requestedByUserId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });

    // Manager notifications (location-specific)
    const managers = await this.getManagerUsers(locationId);
    managers.forEach(manager => {
      recipients.push({
        recipientType: RecipientType.MANAGER,
        recipient: manager.phone!,
        recipientUserId: manager.id,
        recipientRole: 'MANAGER',
      });
    });
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.ADDON_REQUEST_CREATED,
      eventType: EventType.CREATE,
      priority: NotificationPriority.HIGH,
      context,
      workflowStage: 'created',
      metadata: { addonRequestId, locationId, requestedByUserId },
    });
  }

  /**
   * Send notifications for addon request approved
   */
  async createAddonRequestApprovedNotifications(
    addonRequestId: string,
    requestedByUserId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Notify the staff who created the request
    const requestedByUser = await User.findByPk(requestedByUserId, {
      include: [{ model: Staff, as: 'staff' }]
    });

    if (requestedByUser) {
      const userData = requestedByUser.toJSON() as any;
      const phone = userData.staff?.phoneNumber;
      if (phone) {
        recipients.push({
          recipientType: RecipientType.STAFF,
          recipient: phone,
          recipientUserId: requestedByUserId,
          recipientRole: 'STAFF',
        });
      }
    }
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.ADDON_REQUEST_APPROVED,
      eventType: EventType.STATUS_CHANGE,
      priority: NotificationPriority.HIGH,
      context,
      workflowStage: 'approved',
      metadata: { addonRequestId, requestedByUserId },
    });
  }

  /**
   * Send notifications for addon request rejected
   */
  async createAddonRequestRejectedNotifications(
    addonRequestId: string,
    requestedByUserId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Notify the staff who created the request
    const requestedByUser = await User.findByPk(requestedByUserId, {
      include: [{ model: Staff, as: 'staff' }]
    });

    if (requestedByUser) {
      const userData = requestedByUser.toJSON() as any;
      const phone = userData.staff?.phoneNumber;
      if (phone) {
        recipients.push({
          recipientType: RecipientType.STAFF,
          recipient: phone,
          recipientUserId: requestedByUserId,
          recipientRole: 'STAFF',
        });
      }
    }
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.ADDON_REQUEST_REJECTED,
      eventType: EventType.STATUS_CHANGE,
      priority: NotificationPriority.HIGH,
      context,
      workflowStage: 'rejected',
      metadata: { addonRequestId, requestedByUserId },
    });
  }

  /**
   * Send notifications for addon request completed
   */
  async createAddonRequestCompletedNotifications(
    addonRequestId: string,
    requestedByUserId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];
    
    // Notify the staff who created the request
    const requestedByUser = await User.findByPk(requestedByUserId, {
      include: [{ model: Staff, as: 'staff' }]
    });

    if (requestedByUser) {
      const userData = requestedByUser.toJSON() as any;
      const phone = userData.staff?.phoneNumber;
      if (phone) {
        recipients.push({
          recipientType: RecipientType.STAFF,
          recipient: phone,
          recipientUserId: requestedByUserId,
          recipientRole: 'STAFF',
        });
      }
    }
    
    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.ADDON_REQUEST_COMPLETED,
      eventType: EventType.STATUS_CHANGE,
      priority: NotificationPriority.MEDIUM,
      context,
      workflowStage: 'completed',
      metadata: { addonRequestId, requestedByUserId },
    });
  }

  /**
   * Send notifications for payment received
   */
  async createPaymentReceivedNotifications(
    paymentId: string,
    jobSheetId: string,
    customerId: string,
    locationId: string,
    context: TemplateContext
  ): Promise<void> {
    const recipients: NotificationRecipient[] = [];

    // Customer notification
    const customer = await Customer.findByPk(customerId);
    if (customer?.phone) {
      recipients.push({
        recipientType: RecipientType.CUSTOMER,
        recipient: customer.phone,
      });
    }

    // Admin notifications
    const admins = await this.getAdminUsers();
    admins.forEach(admin => {
      recipients.push({
        recipientType: RecipientType.ADMIN,
        recipient: admin.phone!,
        recipientUserId: admin.id,
        recipientRole: 'ADMIN',
      });
    });

    await this.sendToMultipleRecipients(recipients, {
      type: NotificationType.PAYMENT_RECEIVED,
      eventType: EventType.CREATE,
      priority: NotificationPriority.HIGH,
      jobSheetId,
      customerId,
      context,
      workflowStage: 'payment_received',
      metadata: { paymentId },
    });
  }
}
