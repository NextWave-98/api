import { AppError } from '../../shared/utils/app-error';
import { CreateAddonRequestDTO, UpdateAddonRequestDTO, AddonRequestQueryDTO } from './addonrequest.dto';
import { AddonRequest, AddonRequestStatus } from '../../models/addon-request.model';
import { Product, Location, User, Role, Staff } from '../../models';
import { Op } from 'sequelize';
import { SMSService } from '../sms/sms.service';
import { NotificationOrchestrator } from '../notification/notification-orchestrator.service';

export class AddonRequestService {
  private smsService: SMSService;
  private notificationOrchestrator: NotificationOrchestrator;

  constructor() {
    this.smsService = new SMSService();
    this.notificationOrchestrator = new NotificationOrchestrator();
  }

  async createAddonRequest(data: CreateAddonRequestDTO) {
    // Validate product
    const product = await Product.findByPk(data.productId);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    // Validate location
    const location = await Location.findByPk(data.locationId);
    if (!location) {
      throw new AppError(404, 'Location not found');
    }

    // Validate requesting user
    const user = await User.findByPk(data.requestedBy, {
      include: [{ model: Location, as: 'location' }],
    });
    if (!user) {
      throw new AppError(404, 'Requesting user not found');
    }

    // Create addon request
    const addonRequest = await AddonRequest.create({
      productId: data.productId,
      locationId: data.locationId,
      requestedBy: data.requestedBy,
      currentQuantity: data.currentQuantity,
      requestedQuantity: data.requestedQuantity,
      remark: data.remark,
      status: AddonRequestStatus.PENDING,
      smsNotificationSent: false,
      smsDelivered: false,
    });

    // Send SMS notification to admin
    await this.sendAdminNotification(addonRequest.id);

    // Create in-app notifications via orchestrator
    try {
      const productData = product.toJSON() as any;
      const locationData = location.toJSON() as any;
      const userData = user.toJSON() as any;
      
      await this.notificationOrchestrator.createAddonRequestNotifications(
        addonRequest.id,
        data.locationId,
        data.requestedBy,
        {
          productName: productData.name || 'N/A',
          productCode: productData.productCode || productData.code || 'N/A',
          locationName: locationData.name || 'N/A',
          userName: userData.name || 'N/A',
          currentQuantity: data.currentQuantity?.toString() || '0',
          requestedQuantity: data.requestedQuantity?.toString() || '0',
          remark: data.remark || '',
        }
      );
    } catch (error) {
      console.error('Failed to create in-app notifications for addon request:', error);
      // Don't fail the request if notifications fail
    }

    // Return the created request with relations
    return await AddonRequest.findByPk(addonRequest.id, {
      include: [
        { model: Product, as: 'product' },
        { model: Location, as: 'location' },
        { model: User, as: 'requestedByUser' },
      ],
    });
  }

  async sendAdminNotification(addonRequestId: string) {
    const addonRequest = await AddonRequest.findByPk(addonRequestId, {
      include: [
        { model: Product, as: 'product' },
        { model: Location, as: 'location' },
        { 
          model: User, 
          as: 'requestedByUser',
          include: [{ model: Location, as: 'location' }],
        },
      ],
    });

    if (!addonRequest) {
      throw new AppError(404, 'Addon request not found');
    }

    // Get all admin users with their staff records (for phone numbers)
    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      console.warn('Admin role not found, skipping SMS notification');
      return;
    }

    const adminUsers = await User.findAll({
      where: { roleId: adminRole.id, isActive: true },
      include: [{ model: Staff, as: 'staff' }],
    });

    if (adminUsers.length === 0) {
      console.warn('No active admin users found, skipping SMS notification');
      return;
    }

    const product = addonRequest.product as any;
    const location = addonRequest.location as any;
    const requestedBy = addonRequest.requestedByUser as any;

    // Construct SMS message
    const message = `LTS Addon Request:\n` +
      `Product: ${product?.name || 'N/A'} (${product?.productCode || 'N/A'})\n` +
      `Branch: ${location?.name || 'N/A'}\n` +
      `Requested By: ${requestedBy?.name || 'N/A'}\n` +
      `Current Qty: ${addonRequest.currentQuantity}\n` +
      `Requested Qty: ${addonRequest.requestedQuantity}\n` +
      (addonRequest.remark ? `Remark: ${addonRequest.remark}` : '');

    let smsNotificationSent = false;
    let smsDelivered = false;
    let smsResponse = '';
    let smsMessageId = '';
    const smsSendResults: string[] = [];

    // Send SMS to all admin users
    for (const admin of adminUsers) {
      try {
        const adminData = admin.toJSON() as any;
        // Get phone number from staff record
        const adminPhone = adminData.staff?.phoneNumber || adminData.staff?.additionalPhone;
        
        if (adminPhone) {
          console.log(`Sending addon request SMS to admin ${adminData.name} at ${adminPhone}`);
          
          const smsResult = await this.smsService.sendSingleSMS({
            to: adminPhone,
            msg: message,
          });

          if (smsResult.success) {
            smsNotificationSent = true;
            smsDelivered = true;
            smsMessageId = smsResult.message || '';
            smsSendResults.push(`${adminData.name}: Success`);
            console.log(`SMS sent successfully to ${adminData.name}`);
          } else {
            smsSendResults.push(`${adminData.name}: Failed - ${smsResult.message}`);
            console.warn(`SMS failed to ${adminData.name}: ${smsResult.message}`);
          }
        } else {
          console.warn(`Admin ${adminData.name} has no phone number configured`);
          smsSendResults.push(`${adminData.name}: No phone number`);
        }
      } catch (error) {
        const adminData = admin.toJSON() as any;
        console.error(`Failed to send SMS to admin ${adminData.name}:`, error);
        smsSendResults.push(`${adminData.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    smsResponse = smsSendResults.join('; ');

    // Update addon request with SMS status
    await addonRequest.update({
      smsNotificationSent,
      smsDelivered,
      smsResponse,
      smsMessageId,
    });
  }

  async getAddonRequest(id: string) {
    const addonRequest = await AddonRequest.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: Location, as: 'location' },
        { model: User, as: 'requestedByUser' },
      ],
    });

    if (!addonRequest) {
      throw new AppError(404, 'Addon request not found');
    }

    return addonRequest;
  }

  async getAllAddonRequests(query: AddonRequestQueryDTO) {
    const {
      productId,
      locationId,
      requestedBy,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;
    if (requestedBy) where.requestedBy = requestedBy;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const offset = (page - 1) * limit;

    const { rows: addonRequests, count: total } = await AddonRequest.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product' },
        { model: Location, as: 'location' },
        { model: User, as: 'requestedByUser' },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      addonRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateAddonRequest(id: string, data: UpdateAddonRequestDTO) {
    const addonRequest = await AddonRequest.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: Location, as: 'location' },
        { model: User, as: 'requestedByUser' },
      ],
    });

    if (!addonRequest) {
      throw new AppError(404, 'Addon request not found');
    }

    const oldStatus = addonRequest.status;
    await addonRequest.update(data);

    // Send status change notifications
    if (data.status && data.status !== oldStatus) {
      try {
        const addonData = addonRequest.toJSON() as any;
        const context = {
          productName: addonData.product?.name || 'N/A',
          productCode: addonData.product?.productCode || addonData.product?.code || 'N/A',
          locationName: addonData.location?.name || 'N/A',
          userName: addonData.requestedByUser?.name || 'N/A',
          currentQuantity: addonData.currentQuantity?.toString() || '0',
          requestedQuantity: addonData.requestedQuantity?.toString() || '0',
          remark: addonData.remark || '',
          reason: data.remark || addonData.remark || '',
        };

        if (data.status === AddonRequestStatus.APPROVED) {
          await this.notificationOrchestrator.createAddonRequestApprovedNotifications(
            id,
            addonData.requestedBy,
            context
          );
        } else if (data.status === AddonRequestStatus.REJECTED) {
          await this.notificationOrchestrator.createAddonRequestRejectedNotifications(
            id,
            addonData.requestedBy,
            context
          );
        } else if (data.status === AddonRequestStatus.COMPLETED) {
          await this.notificationOrchestrator.createAddonRequestCompletedNotifications(
            id,
            addonData.requestedBy,
            context
          );
        }
      } catch (error) {
        console.error('Failed to send status change notification:', error);
        // Don't fail the update if notifications fail
      }
    }

    return await AddonRequest.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: Location, as: 'location' },
        { model: User, as: 'requestedByUser' },
      ],
    });
  }

  async deleteAddonRequest(id: string) {
    const addonRequest = await AddonRequest.findByPk(id);

    if (!addonRequest) {
      throw new AppError(404, 'Addon request not found');
    }

    await addonRequest.destroy();
    return { message: 'Addon request deleted successfully' };
  }

  async getAddonRequestStats(locationId?: string) {
    const where: any = {};
    if (locationId) where.locationId = locationId;

    const [total, pending, approved, rejected, completed] = await Promise.all([
      AddonRequest.count({ where }),
      AddonRequest.count({ where: { ...where, status: AddonRequestStatus.PENDING } }),
      AddonRequest.count({ where: { ...where, status: AddonRequestStatus.APPROVED } }),
      AddonRequest.count({ where: { ...where, status: AddonRequestStatus.REJECTED } }),
      AddonRequest.count({ where: { ...where, status: AddonRequestStatus.COMPLETED } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      completed,
    };
  }
}
