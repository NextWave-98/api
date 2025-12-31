import { AppError } from '../../shared/utils/app-error';
import {
  JobSheet,
  Customer,
  Device,
  Location,
  User,
  JobStatusHistory,
  JobSheetPart,
  JobSheetProduct,
  Part,
  Product,
  ProductInventory,
  Payment,
} from '../../models';
import { Business } from '../../models/business.model';
import { Op, fn, col, literal, Transaction } from 'sequelize';
import  sequelize  from '../../shared/config/database';
import { NotificationOrchestrator } from '../notification/notification-orchestrator.service';
import { PaymentMethod } from '../../enums';
import {
  CreateJobSheetDTO,
  UpdateJobSheetDTO,
  UpdateJobSheetStatusDTO,
  JobSheetQueryDTO,
  AddPartToJobSheetDTO,
  AddProductToJobSheetDTO,
  DownloadJobSheetDTO,
  PrintJobSheetDTO,
} from './jobsheet.dto';
const PDFDocument = require('pdfkit');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

export class JobSheetService {
  private notificationOrchestrator = new NotificationOrchestrator();

  /**
   * Generate next job number in format JS-2025-0001
   */
  private async generateJobNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JS-${year}-`;

    const lastJob = await JobSheet.findOne({
      where: {
        jobNumber: {
          [Op.startsWith]: prefix,
        },
      },
      order: [['job_number', 'DESC']],
      attributes: ['jobNumber'],
    });

    if (!lastJob) {
      return `${prefix}0001`;
    }

    const lastNumber = parseInt(lastJob.jobNumber.split('-')[2], 10);
    const nextNumber = lastNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Generate next payment number in format PAY-2025-0001
   */
  private async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-${year}-`;

    const lastPayment = await Payment.findOne({
      where: {
        paymentNumber: { [Op.startsWith]: prefix },
      },
      order: [['payment_number', 'DESC']],
      attributes: ['paymentNumber'],
    });

    if (!lastPayment) {
      return `${prefix}0001`;
    }

    const lastNumber = parseInt(lastPayment.paymentNumber.split('-')[2], 10);
    const nextNumber = lastNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate total amount
   */
  private calculateTotal(
    labourCost: number,
    partsCost: number,
    discountAmount: number
  ): number {
    return labourCost + partsCost - discountAmount;
  }

  /**
   * Create a new job sheet
   */
  async createJobSheet(data: CreateJobSheetDTO, createdById: string) {
    const transaction = await sequelize.transaction();

    try {
      // Verify customer exists
      const customer = await Customer.findByPk(data.customerId, { transaction });
      if (!customer) {
        throw new AppError(404, 'Customer not found');
      }

      // Verify device exists and belongs to customer
      const device = await Device.findByPk(data.deviceId, { transaction });
      if (!device) {
        throw new AppError(404, 'Device not found');
      }
      if (device.customerId !== data.customerId) {
        throw new AppError(400, 'Device does not belong to this customer');
      }

      // Verify location exists
      const location = await Location.findByPk(data.locationId, { transaction });
      if (!location) {
        throw new AppError(404, 'Location not found');
      }

      // Verify assigned user if provided
      if (data.assignedToId) {
        const user = await User.findByPk(data.assignedToId, { transaction });
        if (!user) {
          throw new AppError(404, 'Assigned user not found');
        }
      }

      const jobNumber = await this.generateJobNumber();

      // Calculate costs
      const labourCost = data.labourCost || 0;
      const partsCost = data.partsCost || 0;
      const discountAmount = data.discountAmount || 0;
      const paidAmount = data.paidAmount || 0;

      // Total amount = labourCost + partsCost - discountAmount
      const totalAmount = this.calculateTotal(labourCost, partsCost, discountAmount);

      // Actual cost is the sum of labour and parts (before discount)
      const actualCost = labourCost + partsCost;

      // Estimated cost can be set explicitly or default to actual cost
      const estimatedCost = data.estimatedCost || actualCost;

      // Balance amount = totalAmount - paidAmount
      const balanceAmount = totalAmount - paidAmount;

      // Calculate warranty expiry if warranty period is provided
      const warrantyExpiry = data.warrantyPeriod
        ? new Date(Date.now() + data.warrantyPeriod * 24 * 60 * 60 * 1000)
        : null;

      const jobSheet = await JobSheet.create({
        jobNumber,
        customerId: data.customerId,
        deviceId: data.deviceId,
        locationId: data.locationId,
        createdById,
        assignedToId: data.assignedToId,
        issueDescription: data.issueDescription,
        customerRemarks: data.customerRemarks,
        technicianRemarks: data.technicianRemarks,
        deviceCondition: data.deviceCondition,
        accessories: data.accessories,
        devicePassword: data.devicePassword,
        backupTaken: data.backupTaken,
        status: data.status || 'PENDING',
        priority: data.priority || 'NORMAL',
        // Accept either `expectedDate` or `expectedCompletionDate` (frontend alias)
        expectedDate: data.expectedDate
          ? new Date(data.expectedDate)
          : data.expectedCompletionDate
          ? new Date(data.expectedCompletionDate)
          : null,
        estimatedCost,
        actualCost,
        labourCost,
        partsCost,
        discountAmount,
        totalAmount,
        paidAmount,
        balanceAmount,
        warrantyPeriod: data.warrantyPeriod,
        warrantyExpiry,
      }, { transaction });

      // Create status history
      await JobStatusHistory.create({
        jobSheetId: jobSheet.id,
        toStatus: jobSheet.status,
        remarks: 'Job sheet created',
      }, { transaction });

      // Create payment record if advance payment was made
      if (paidAmount > 0) {
        const paymentNumber = await this.generatePaymentNumber();
        await Payment.create({
          paymentNumber,
          jobSheetId: jobSheet.id,
          customerId: data.customerId,
          receivedBy: createdById,
          amount: paidAmount,
          paymentMethod: PaymentMethod.CASH, // Default payment method for advance payments
          paymentDate: new Date(),
          notes: 'Advance payment for job sheet creation',
        }, { transaction });
      }

      // Reload with associations
      await jobSheet.reload({
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'customer_id', 'name', 'phone', 'email'],
          },
          {
            model: Device,
            as: 'device',
          },
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'address', 'phone'],
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: User,
            as: 'assignedTo',
            attributes: ['id', 'name', 'email'],
          },
        ],
        transaction,
      });

      await transaction.commit();

      // Send creation notifications (Customer + Admin) - outside transaction
      try {
        await this.notificationOrchestrator.createJobSheetNotifications(
          jobSheet.id,
          jobSheet.customerId,
          jobSheet.locationId,
          {
            customerName: jobSheet.customer?.name || '',
            jobSheetNumber: jobSheet.jobNumber,
            estimatedCost: (Number(jobSheet.estimatedCost) || 0).toFixed(2),
            locationName: jobSheet.location?.name || '',
            companyName: 'LTS Phone Shop',
            contactPhone: jobSheet.location?.phone || '',
            deviceType: jobSheet.device?.deviceType || '',
          }
        );
      } catch (notificationError) {
        console.error('Error sending job sheet creation notifications:', notificationError);
      }

      return jobSheet.toJSON();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all job sheets with pagination and filters
   */
  async getJobSheets(query: JobSheetQueryDTO) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where[Op.or] = [
        { jobNumber: { [Op.iLike]: `%${query.search}%` } },
        { '$customer.name$': { [Op.iLike]: `%${query.search}%` } },
        { '$customer.phone$': { [Op.iLike]: `%${query.search}%` } },
        { '$device.brand$': { [Op.iLike]: `%${query.search}%` } },
        { '$device.model$': { [Op.iLike]: `%${query.search}%` } },
        { issueDescription: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Normalize status to uppercase for database query
    if (query.status) {
      where.status = query.status.toUpperCase();
    }

    // Normalize priority to uppercase for database query
    if (query.priority) {
      where.priority = query.priority.toUpperCase();
    }

    if (query.locationId) {
      where.locationId = query.locationId;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.assignedToId) {
      where.assignedToId = query.assignedToId;
    }

    // Date filtering logic - Default to 'today' if no dateFilter is provided
    const dateFilter = query.dateFilter || 'today';
    
    if (dateFilter === 'custom' && (query.fromDate || query.toDate)) {
      where.receivedDate = {};
      if (query.fromDate) {
        const fromDate = new Date(query.fromDate);
        fromDate.setHours(0, 0, 0, 0);
        where.receivedDate[Op.gte] = fromDate;
      }
      if (query.toDate) {
        const toDate = new Date(query.toDate);
        toDate.setHours(23, 59, 59, 999);
        where.receivedDate[Op.lte] = toDate;
      }
    } else if (dateFilter !== 'all') {
      // Apply predefined date filters (defaults to 'today')
      const now = new Date();
      where.receivedDate = {};

      switch (dateFilter) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          where.receivedDate[Op.gte] = today;
          where.receivedDate[Op.lt] = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'yesterday':
          const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          where.receivedDate[Op.gte] = yesterday;
          where.receivedDate[Op.lt] = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'this_week':
          const dayOfWeek = now.getDay();
          const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday (0), go back 6 days; else go to Monday
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() + diffToMonday);
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
          endOfWeek.setHours(23, 59, 59, 999);
          where.receivedDate[Op.gte] = startOfWeek;
          where.receivedDate[Op.lte] = endOfWeek;
          break;
        case 'this_month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          where.receivedDate[Op.gte] = startOfMonth;
          where.receivedDate[Op.lte] = endOfMonth;
          break;
        case 'this_year':
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          where.receivedDate[Op.gte] = startOfYear;
          where.receivedDate[Op.lte] = endOfYear;
          break;
      }
    }

    const { count: total, rows: jobSheets } = await JobSheet.findAndCountAll({
      where,
      offset,
      limit,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name', 'phone', 'email'],
        },
        {
          model: Device,
          as: 'device',
          attributes: ['id', 'device_type', 'brand', 'model', 'serial_number'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address'],
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['received_date', 'DESC']],
      distinct: true,
    });

    return {
      jobSheets: jobSheets.map(js => js.toJSON()),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get job sheet by ID
   */
  async getJobSheetById(id: string) {
    const jobSheet = await JobSheet.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name', 'phone', 'email', 'address'],
        },
        {
          model: Device,
          as: 'device',
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address', 'phone', 'email'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: JobSheetPart,
          as: 'parts',
          include: [
            {
              model: Part,
              as: 'part',
              attributes: ['id', 'partNumber', 'name', 'costPrice', 'unitPrice'],
            },
          ],
        },
        {
          model: JobSheetProduct,
          as: 'products',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'product_code', 'name', 'unit_price', 'cost_price'],
            },
          ],
        },
        {
          model: JobStatusHistory,
          as: 'statusHistory',
        },
      ],
    });

    if (!jobSheet) {
      throw new AppError(404, 'Job sheet not found');
    }

    const jobSheetData = jobSheet.toJSON();

    // Add payment information
    const payments = await Payment.findAll({
      where: { jobSheetId: id },
      attributes: ['id', 'amount', 'payment_method', 'payment_date', 'notes'],
      order: [['payment_date', 'DESC']],
    });

    return {
      ...jobSheetData,
      payments: payments.map(p => p.toJSON()),
    };
  }

  /**
   * Get job sheet by job number
   */
  async getJobSheetByJobNumber(jobNumber: string) {
    const jobSheet = await JobSheet.findOne({
      where: { jobNumber },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name', 'phone', 'email'],
        },
        {
          model: Device,
          as: 'device',
          attributes: ['id', 'device_type', 'brand', 'model', 'serial_number'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address'],
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!jobSheet) {
      throw new AppError(404, 'Job sheet not found');
    }

    return jobSheet.toJSON();
  }

  /**
   * Update job sheet
   */
  async updateJobSheet(id: string, data: UpdateJobSheetDTO) {
    const transaction = await sequelize.transaction();

    try {
      const jobSheet = await JobSheet.findByPk(id, { transaction });
      if (!jobSheet) {
        throw new AppError(404, 'Job sheet not found');
      }

      // Verify assigned user if provided
      if (data.assignedToId) {
        const user = await User.findByPk(data.assignedToId, { transaction });
        if (!user) {
          throw new AppError(404, 'Assigned user not found');
        }
      }

      // Calculate new costs if any cost fields are updated
      let updateData: any = { ...data };

      if (data.labourCost !== undefined || data.partsCost !== undefined || data.discountAmount !== undefined) {
        const labourCost = data.labourCost !== undefined ? data.labourCost : jobSheet.labourCost;
        const partsCost = data.partsCost !== undefined ? data.partsCost : jobSheet.partsCost;
        const discountAmount = data.discountAmount !== undefined ? data.discountAmount : jobSheet.discountAmount;

        updateData.totalAmount = this.calculateTotal(labourCost, partsCost, discountAmount);
        updateData.actualCost = labourCost + partsCost;
        updateData.balanceAmount = updateData.totalAmount - jobSheet.paidAmount;
      }

      // Handle expected date aliases
      if (data.expectedDate !== undefined) {
        updateData.expectedDate = data.expectedDate ? new Date(data.expectedDate) : null;
      } else if (data.expectedCompletionDate !== undefined) {
        updateData.expectedDate = data.expectedCompletionDate ? new Date(data.expectedCompletionDate) : null;
      }

      // Calculate warranty expiry if warranty period is updated
      if (data.warrantyPeriod !== undefined) {
        updateData.warrantyExpiry = data.warrantyPeriod
          ? new Date(Date.now() + data.warrantyPeriod * 24 * 60 * 60 * 1000)
          : null;
      }

      // Store old status for notification check
      const oldStatus = jobSheet.status;

      // Validate status transition if status is being updated
      if (data.status && data.status !== oldStatus) {
        const validTransitions: Record<string, string[]> = {
          PENDING: ['IN_PROGRESS', 'CANCELLED'],
          IN_PROGRESS: ['WAITING_PARTS', 'QUALITY_CHECK', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
          WAITING_PARTS: ['IN_PROGRESS', 'QUALITY_CHECK', 'CANCELLED'],
          WAITING_APPROVAL: ['IN_PROGRESS', 'CANCELLED'],
          QUALITY_CHECK: ['COMPLETED', 'IN_PROGRESS', 'CANCELLED'],
          COMPLETED: ['DELIVERED','READY_DELIVERY'], // Terminal state
          READY_DELIVERY: ['DELIVERED', 'CANCELLED'],
          DELIVERED: [], // Terminal state
          CANCELLED: [], // Terminal state
          ON_HOLD:['WAITING_PARTS', 'QUALITY_CHECK', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
        };

        if (!validTransitions[oldStatus]?.includes(data.status)) {
          throw new AppError(400, `Invalid status transition from ${oldStatus} to ${data.status}`);
        }

        // Update completion date if status is COMPLETED
        if (data.status === 'COMPLETED') {
          updateData.completedDate = new Date();
        }
      }

      await jobSheet.update(updateData, { transaction });

      // Create status history if status was changed
      if (data.status && data.status !== oldStatus) {
        await JobStatusHistory.create({
          jobSheetId: id,
          fromStatus: oldStatus,
          toStatus: data.status,
          remarks: `Status changed from ${oldStatus} to ${data.status}`,
        }, { transaction });
      }

      await transaction.commit();

      // Get the updated job sheet with associations for notifications
      const updatedJobSheet = await this.getJobSheetById(id);

      // Send notifications if status was updated
      if (data.status && data.status !== oldStatus) {
        console.log('🔄 STATUS UPDATE DETECTED:', {
          oldStatus: oldStatus,
          newStatus: data.status,
          jobSheetId: id
        });
        
        try {
          const newStatus = data.status;
          console.log('📤 SENDING NOTIFICATIONS FOR STATUS:', newStatus);
          if (newStatus === 'COMPLETED') {
            await this.notificationOrchestrator.createJobCompletionNotifications(
              id,
              updatedJobSheet.customerId,
              updatedJobSheet.locationId,
              {
                customerName: updatedJobSheet.customer?.name || '',
                jobSheetNumber: updatedJobSheet.jobNumber,
                deviceType: updatedJobSheet.device?.deviceType || 'Device',
                actualCost: (Number(updatedJobSheet.actualCost) || 0).toFixed(2),
                technicianName: updatedJobSheet.assignedTo?.name || 'Technician',
                totalAmount: (Number(updatedJobSheet.totalAmount) || 0).toFixed(2),
                locationName: updatedJobSheet.location?.name || '',
                companyName: 'LTS Phone Shop',
                contactPhone: updatedJobSheet.location?.phone || '',
              }
            );
          } else if (newStatus === 'IN_PROGRESS') {
            // Send repair started notification
            await this.notificationOrchestrator.createJobRepairingNotifications(
              id,
              updatedJobSheet.customerId,
              updatedJobSheet.locationId,
              {
                customerName: updatedJobSheet.customer?.name || '',
                jobSheetNumber: updatedJobSheet.jobNumber,
                deviceInfo: `${updatedJobSheet.device?.brand || ''} ${updatedJobSheet.device?.model || ''}`.trim(),
                estimatedCompletion: updatedJobSheet.expectedDate ? new Date(updatedJobSheet.expectedDate).toLocaleDateString() : 'TBD',
                companyName: 'LTS Phone Shop',
              }
            );
          } else if (newStatus === 'READY_DELIVERY') {
            // Send ready for pickup notification
            await this.notificationOrchestrator.createJobReadyPickupNotifications(
              id,
              updatedJobSheet.customerId,
              updatedJobSheet.locationId,
              {
                customerName: updatedJobSheet.customer?.name || '',
                jobSheetNumber: updatedJobSheet.jobNumber,
                estimatedCost: (Number(updatedJobSheet.estimatedCost) || 0).toFixed(2),
                labourCost: (Number(updatedJobSheet.labourCost) || 0).toFixed(2),
                partsCost: (Number(updatedJobSheet.partsCost) || 0).toFixed(2),
                discountAmount: (Number(updatedJobSheet.discountAmount) || 0).toFixed(2),
                totalAmount: (Number(updatedJobSheet.totalAmount) || 0).toFixed(2),
                paidAmount: (Number(updatedJobSheet.paidAmount) || 0).toFixed(2),
                balanceAmount: (Number(updatedJobSheet.balanceAmount) || 0).toFixed(2),
                pickupLocation: updatedJobSheet.location?.name || '',
                companyName: 'LTS Phone Shop',
                contactPhone: updatedJobSheet.location?.phone || '',
              }
            );
          } else if (newStatus === 'DELIVERED') {
            // Send delivered notification
            await this.notificationOrchestrator.createJobDeliveredNotifications(
              id,
              updatedJobSheet.customerId,
              updatedJobSheet.locationId,
              {
                customerName: updatedJobSheet.customer?.name || '',
                jobSheetNumber: updatedJobSheet.jobNumber,
                deliveryDate: new Date().toLocaleDateString(),
                totalAmount: (Number(updatedJobSheet.totalAmount) || 0).toFixed(2),
                paidAmount: (Number(updatedJobSheet.paidAmount) || 0).toFixed(2),
                balanceAmount: (Number(updatedJobSheet.balanceAmount) || 0).toFixed(2),
                warrantyInfo: updatedJobSheet.warrantyPeriod ? `Warranty: ${updatedJobSheet.warrantyPeriod} days` : 'No warranty',
                companyName: 'LTS Phone Shop',
              }
            );
          } else if (newStatus === 'CANCELLED') {
            // Send cancellation notification
            await this.notificationOrchestrator.createJobCancellationNotifications(
              id,
              updatedJobSheet.customerId,
              updatedJobSheet.locationId,
              {
                customerName: updatedJobSheet.customer?.name || '',
                jobSheetNumber: updatedJobSheet.jobNumber,
                reason: data.remarks || 'No reason provided',
                locationName: updatedJobSheet.location?.name || '',
                companyName: 'LTS Phone Shop',
                contactPhone: updatedJobSheet.location?.phone || '',
              }
            );
          }
        } catch (notificationError) {
          console.error('Error sending job sheet update notifications:', notificationError);
        }
      }

      return updatedJobSheet;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update job sheet status
   */
  async updateJobSheetStatus(id: string, data: UpdateJobSheetStatusDTO) {
    const transaction = await sequelize.transaction();

    try {
      const jobSheet = await JobSheet.findByPk(id, { transaction });
      if (!jobSheet) {
        throw new AppError(404, 'Job sheet not found');
      }

      const oldStatus = jobSheet.status;
      const newStatus = data.status;

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        PENDING: ['IN_PROGRESS', 'CANCELLED'],
        IN_PROGRESS: ['WAITING_PARTS', 'QUALITY_CHECK', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
        WAITING_PARTS: ['IN_PROGRESS', 'QUALITY_CHECK', 'CANCELLED'],
        WAITING_APPROVAL: ['IN_PROGRESS', 'CANCELLED'],
        QUALITY_CHECK: ['COMPLETED', 'IN_PROGRESS', 'CANCELLED'],
        COMPLETED: [], // Terminal state
        READY_DELIVERY: ['DELIVERED', 'CANCELLED'],
        DELIVERED: [], // Terminal state
        CANCELLED: [], // Terminal state
        ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
      };

      if (!validTransitions[oldStatus]?.includes(newStatus)) {
        throw new AppError(400, `Invalid status transition from ${oldStatus} to ${newStatus}`);
      }

      // Update completion date if status is COMPLETED
      const updateData: any = {
        status: newStatus,
      };

      if (newStatus === 'COMPLETED') {
        updateData.completedDate = new Date();
      }

      await jobSheet.update(updateData, { transaction });

      // Create status history
      await JobStatusHistory.create({
        jobSheetId: id,
        fromStatus: oldStatus,
        toStatus: newStatus,
        remarks: data.remarks || `Status changed from ${oldStatus} to ${newStatus}`,
      }, { transaction });

      await transaction.commit();

      // Get the updated job sheet with associations for notifications
      const updatedJobSheet = await this.getJobSheetById(id);

      // Send notifications based on status change
      try {
        if (newStatus === 'COMPLETED') {
          await this.notificationOrchestrator.createJobCompletionNotifications(
            id,
            updatedJobSheet.customerId,
            updatedJobSheet.locationId,
            {
              customerName: updatedJobSheet.customer?.name || '',
              jobSheetNumber: updatedJobSheet.jobNumber,
              deviceType: updatedJobSheet.device?.deviceType || 'Device',
              actualCost: (Number(updatedJobSheet.actualCost) || 0).toFixed(2),
              technicianName: updatedJobSheet.assignedTo?.name || 'Technician',
              totalAmount: (Number(updatedJobSheet.totalAmount) || 0).toFixed(2),
              locationName: updatedJobSheet.location?.name || '',
              companyName: 'LTS Phone Shop',
              contactPhone: updatedJobSheet.location?.phone || '',
            }
          );
        } else if (newStatus === 'IN_PROGRESS') {
          // Send repair started notification
          await this.notificationOrchestrator.createJobRepairingNotifications(
            id,
            jobSheet.customerId,
            jobSheet.locationId,
            {
              customerName: jobSheet.customer?.name || '',
              jobSheetNumber: jobSheet.jobNumber,
              deviceInfo: `${jobSheet.device?.brand || ''} ${jobSheet.device?.model || ''}`.trim(),
              estimatedCompletion: jobSheet.expectedDate ? new Date(jobSheet.expectedDate).toLocaleDateString() : 'TBD',
              companyName: 'LTS Phone Shop',
            }
          );
        } else if (newStatus === 'READY_DELIVERY') {
          // Send ready for pickup notification
          await this.notificationOrchestrator.createJobReadyPickupNotifications(
            id,
            jobSheet.customerId,
            jobSheet.locationId,
            {
              customerName: jobSheet.customer?.name || '',
              jobSheetNumber: jobSheet.jobNumber,
              estimatedCost: (Number(jobSheet.estimatedCost) || 0).toFixed(2),
              labourCost: (Number(jobSheet.labourCost) || 0).toFixed(2),
              partsCost: (Number(jobSheet.partsCost) || 0).toFixed(2),
              discountAmount: (Number(jobSheet.discountAmount) || 0).toFixed(2),
              totalAmount: (Number(jobSheet.totalAmount) || 0).toFixed(2),
              paidAmount: (Number(jobSheet.paidAmount) || 0).toFixed(2),
              balanceAmount: (Number(jobSheet.balanceAmount) || 0).toFixed(2),
              pickupLocation: jobSheet.location?.name || '',
              companyName: 'LTS Phone Shop',
              contactPhone: jobSheet.location?.phone || '',
            }
          );
        } else if (newStatus === 'DELIVERED') {
          // Send delivered notification
          await this.notificationOrchestrator.createJobDeliveredNotifications(
            id,
            jobSheet.customerId,
            jobSheet.locationId,
            {
              customerName: jobSheet.customer?.name || '',
              jobSheetNumber: jobSheet.jobNumber,
              deliveryDate: new Date().toLocaleDateString(),
              warrantyInfo: jobSheet.warrantyPeriod ? `Warranty: ${jobSheet.warrantyPeriod} days` : 'No warranty',
              totalAmount: (Number(jobSheet.totalAmount) || 0).toFixed(2),
              paidAmount: (Number(jobSheet.paidAmount) || 0).toFixed(2),
              balanceAmount: (Number(jobSheet.balanceAmount) || 0).toFixed(2),
              companyName: 'LTS Phone Shop',
            }
          );
        } else if (newStatus === 'CANCELLED') {
          // Send cancellation notification
          await this.notificationOrchestrator.createJobCancellationNotifications(
            id,
            updatedJobSheet.customerId,
            updatedJobSheet.locationId,
            {
              customerName: updatedJobSheet.customer?.name || '',
              jobSheetNumber: updatedJobSheet.jobNumber,
              locationName: updatedJobSheet.location?.name || '',
              companyName: 'LTS Phone Shop',
              contactPhone: updatedJobSheet.location?.phone || '',
            }
          );
        }
      } catch (notificationError) {
        console.error('Error sending status change notifications:', notificationError);
      }

      return this.getJobSheetById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Add part to job sheet
   */
  async addPartToJobSheet(jobSheetId: string, data: AddPartToJobSheetDTO) {
    const transaction = await sequelize.transaction();

    try {
      // Verify job sheet exists
      const jobSheet = await JobSheet.findByPk(jobSheetId, { transaction });
      if (!jobSheet) {
        throw new AppError(404, 'Job sheet not found');
      }

      // Verify part exists
      const part = await Part.findByPk(data.partId, { transaction });
      if (!part) {
        throw new AppError(404, 'Part not found');
      }

      // Check if part is already added to this job sheet
      const existingPart = await JobSheetPart.findOne({
        where: {
          jobSheetId,
          partId: data.partId,
        },
        transaction,
      });

      if (existingPart) {
        throw new AppError(400, 'Part already added to this job sheet');
      }

      // Calculate total cost
      const quantity = data.quantity || 1;
      const unitCost = data.unitPrice; // DTO has unitPrice, not unitCost
      const totalCost = quantity * unitCost;

      // Create job sheet part
      const jobSheetPart = await JobSheetPart.create({
        jobSheetId,
        partId: data.partId,
        quantity,
        unitPrice: unitCost,
        totalPrice: totalCost,
        warrantyMonths: data.warrantyMonths || 0,
      }, { transaction });

      // Update job sheet parts cost
      const currentPartsCost = jobSheet.partsCost || 0;
      const newPartsCost = currentPartsCost + totalCost;
      const newTotalAmount = this.calculateTotal(
        jobSheet.labourCost,
        newPartsCost,
        jobSheet.discountAmount
      );

      await jobSheet.update({
        partsCost: newPartsCost,
        actualCost: jobSheet.labourCost + newPartsCost,
        totalAmount: newTotalAmount,
        balanceAmount: newTotalAmount - jobSheet.paidAmount,
      }, { transaction });

      await transaction.commit();

      // Return with part details
      await jobSheetPart.reload({
        include: [
          {
            model: Part,
            as: 'part',
            attributes: ['id', 'part_code', 'name', 'cost_price', 'selling_price'],
          },
        ],
      });

      return jobSheetPart.toJSON();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Remove part from job sheet
   */
  async removePartFromJobSheet(jobSheetId: string, jobSheetPartId: string) {
    const transaction = await sequelize.transaction();

    try {
      // Verify job sheet part exists
      const jobSheetPart = await JobSheetPart.findByPk(jobSheetPartId, { transaction });
      if (!jobSheetPart || jobSheetPart.jobSheetId !== jobSheetId) {
        throw new AppError(404, 'Job sheet part not found');
      }

      // Get job sheet
      const jobSheet = await JobSheet.findByPk(jobSheetId, { transaction });
      if (!jobSheet) {
        throw new AppError(404, 'Job sheet not found');
      }

      const partCost = jobSheetPart.totalPrice;

      // Remove the part
      await jobSheetPart.destroy({ transaction });

      // Update job sheet costs
      const newPartsCost = jobSheet.partsCost - partCost;
      const newTotalAmount = this.calculateTotal(
        jobSheet.labourCost,
        newPartsCost,
        jobSheet.discountAmount
      );

      await jobSheet.update({
        partsCost: newPartsCost,
        actualCost: jobSheet.labourCost + newPartsCost,
        totalAmount: newTotalAmount,
        balanceAmount: newTotalAmount - jobSheet.paidAmount,
      }, { transaction });

      await transaction.commit();

      return { message: 'Part removed from job sheet successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get job sheet statistics
   */
  async getJobSheetStats(params?: { locationId?: string; dateFilter?: string; fromDate?: string; toDate?: string }) {
    const where: any = {};
    if (params?.locationId) {
      where.locationId = params.locationId;
    }

    // Apply date filtering
    if (params?.dateFilter && params.dateFilter !== 'all') {
      const now = new Date();
      where.receivedDate = {};

      if (params.dateFilter === 'custom' && (params.fromDate || params.toDate)) {
        if (params.fromDate) {
          const fromDate = new Date(params.fromDate);
          fromDate.setHours(0, 0, 0, 0);
          where.receivedDate[Op.gte] = fromDate;
        }
        if (params.toDate) {
          const toDate = new Date(params.toDate);
          toDate.setHours(23, 59, 59, 999);
          where.receivedDate[Op.lte] = toDate;
        }
      } else {
        switch (params.dateFilter) {
          case 'today':
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            where.receivedDate[Op.gte] = today;
            where.receivedDate[Op.lt] = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'yesterday':
            const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            where.receivedDate[Op.gte] = yesterday;
            where.receivedDate[Op.lt] = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'this_week':
            const dayOfWeek = now.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday (0), go back 6 days; else go to Monday
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() + diffToMonday);
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            where.receivedDate[Op.gte] = startOfWeek;
            where.receivedDate[Op.lte] = endOfWeek;
            break;
          case 'this_month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            where.receivedDate[Op.gte] = startOfMonth;
            where.receivedDate[Op.lte] = endOfMonth;
            break;
          case 'this_year':
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            where.receivedDate[Op.gte] = startOfYear;
            where.receivedDate[Op.lte] = endOfYear;
            break;
        }
      }
    }

    const [
      totalJobSheets,
      pendingCount,
      inProgressCount,
      completedCount,
      cancelledCount,
      totalRevenue,
      monthlyRevenue,
      totalAdvancePayments,
      monthlyAdvancePayments,
      totalDueBalance,
      monthlyDueBalance,
      averageCompletionTime,
    ] = await Promise.all([
      JobSheet.count({ where }),

      JobSheet.count({ where: { ...where, status: 'PENDING' } }),
      JobSheet.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      JobSheet.count({ where: { ...where, status: 'COMPLETED' } }),
      JobSheet.count({ where: { ...where, status: 'CANCELLED' } }),

      JobSheet.sum('totalAmount', { where: { ...where, status: 'COMPLETED' } }).then(sum => sum || 0),

      // Monthly revenue for current month
      JobSheet.sum('totalAmount', {
        where: {
          ...where,
          status: 'COMPLETED',
          completedDate: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }).then(sum => sum || 0),

      // Total advance payments (paidAmount from all jobsheets)
      JobSheet.sum('paidAmount', { where }).then(sum => sum || 0),

      // Monthly advance payments
      JobSheet.sum('paidAmount', {
        where: {
          ...where,
          receivedDate: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }).then(sum => sum || 0),

      // Total due balance (balanceAmount from all jobsheets)
      JobSheet.sum('balanceAmount', { where }).then(sum => sum || 0),

      // Monthly due balance
      JobSheet.sum('balanceAmount', {
        where: {
          ...where,
          receivedDate: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }).then(sum => sum || 0),

      // Average completion time in hours
      JobSheet.findAll({
        where: {
          ...where,
          status: 'COMPLETED',
          receivedDate: { [Op.ne]: null },
          completedDate: { [Op.ne]: null },
        },
        attributes: [
          [fn('AVG', literal('EXTRACT(EPOCH FROM ("completed_date" - "received_date")) / 3600')), 'avgHours'],
        ],
        raw: true,
      }).then((result: any) => parseFloat(result[0]?.avgHours || '0')),
    ]);

    // Get status distribution
    const statusDistribution = [
      { status: 'PENDING', count: pendingCount },
      { status: 'IN_PROGRESS', count: inProgressCount },
      { status: 'COMPLETED', count: completedCount },
      { status: 'CANCELLED', count: cancelledCount },
    ];

    // Get priority distribution
    const priorityStats = await JobSheet.findAll({
      where,
      attributes: [
        'priority',
        [fn('COUNT', col('JobSheet.id')), 'count'],
      ],
      group: ['priority'],
      raw: true,
    });

    const priorityDistribution = priorityStats.map((stat: any) => ({
      priority: stat.priority,
      count: parseInt(stat.count, 10),
    }));

    // Get monthly trends (last 12 months)
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthRevenue = await JobSheet.sum('totalAmount', {
        where: {
          ...where,
          status: 'COMPLETED',
          completedDate: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
      }) || 0;

      const monthCount = await JobSheet.count({
        where: {
          ...where,
          receivedDate: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
      });

      monthlyTrends.push({
        month: startOfMonth.toISOString().slice(0, 7), // YYYY-MM format
        revenue: monthRevenue,
        count: monthCount,
      });
    }

    return {
      summary: {
        totalJobSheets,
        totalRevenue,
        monthlyRevenue,
        totalAdvancePayments,
        monthlyAdvancePayments,
        totalDueBalance,
        monthlyDueBalance,
        averageCompletionTime: Math.round(averageCompletionTime * 100) / 100, // Round to 2 decimal places
      },
      statusDistribution,
      priorityDistribution,
      monthlyTrends,
    };
  }

  /**
   * Get overdue job sheets
   */
  async getOverdueJobSheets(locationId?: string) {
    const where: any = {
      status: { [Op.in]: ['PENDING', 'IN_PROGRESS'] },
      expectedDate: { [Op.lt]: new Date() },
    };

    if (locationId) {
      where.locationId = locationId;
    }

    const overdueJobSheets = await JobSheet.findAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_id', 'name', 'phone', 'email'],
        },
        {
          model: Device,
          as: 'device',
          attributes: ['id', 'device_type', 'brand', 'model', 'serial_number'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address'],
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['expected_date', 'ASC']],
    });

    return overdueJobSheets.map(js => {
      const jobSheetData = js.toJSON();
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(jobSheetData.expectedDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...jobSheetData,
        daysOverdue,
      };
    });
  }

  /**
   * Delete job sheet
   */
  async deleteJobSheet(id: string) {
    const transaction = await sequelize.transaction();

    try {
      const jobSheet = await JobSheet.findByPk(id, { transaction });
      if (!jobSheet) {
        throw new AppError(404, 'Job sheet not found');
      }

      // Check if job sheet has payments
      const paymentCount = await Payment.count({
        where: { jobSheetId: id },
        transaction,
      });

      if (paymentCount > 0) {
        throw new AppError(400, 'Cannot delete job sheet with existing payments');
      }

      // Delete related records
      await JobStatusHistory.destroy({
        where: { jobSheetId: id },
        transaction,
      });

      await JobSheetPart.destroy({
        where: { jobSheetId: id },
        transaction,
      });

      await JobSheetProduct.destroy({
        where: { jobSheetId: id },
        transaction,
      });

      // Delete the job sheet
      await jobSheet.destroy({ transaction });

      await transaction.commit();

      return { message: 'Job sheet deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get job sheet status history
   */
  async getJobSheetStatusHistory(id: string) {
    // Verify job sheet exists
    const jobSheet = await JobSheet.findByPk(id);
    if (!jobSheet) {
      throw new AppError(404, 'Job sheet not found');
    }

    const statusHistory = await JobStatusHistory.findAll({
      where: { jobSheetId: id },
      order: [['changedAt', 'DESC']],
    });

    return {
      jobSheet: {
        id: jobSheet.id,
        jobNumber: jobSheet.jobNumber,
      },
      statusHistory: statusHistory.map(sh => sh.toJSON()),
    };
  }

  /**
   * Get job sheet payments
   */
  async getJobSheetPayments(id: string) {
    // Verify job sheet exists
    const jobSheet = await JobSheet.findByPk(id);
    if (!jobSheet) {
      throw new AppError(404, 'Job sheet not found');
    }

    const payments = await Payment.findAll({
      where: { jobSheetId: id },
      include: [
        {
          model: User,
          as: 'receivedByUser',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['payment_date', 'DESC']],
    });

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const balanceAmount = jobSheet.totalAmount - totalPaid;

    return {
      jobSheet: {
        id: jobSheet.id,
        jobNumber: jobSheet.jobNumber,
        totalAmount: jobSheet.totalAmount,
        paidAmount: totalPaid,
        balanceAmount,
      },
      payments: payments.map(p => p.toJSON()),
    };
  }

  /**
   * Add product to job sheet
   */
  async addProductToJobSheet(jobSheetId: string, data: AddProductToJobSheetDTO) {
    const transaction = await sequelize.transaction();

    try {
      // Verify job sheet exists
      const jobSheet = await JobSheet.findByPk(jobSheetId, { transaction });
      if (!jobSheet) {
        throw new AppError(404, 'Job sheet not found');
      }

      // Verify product exists
      const product = await Product.findByPk(data.productId, { transaction });
      if (!product) {
        throw new AppError(404, 'Product not found');
      }

      // Check if product is already added to this job sheet
      const existingProduct = await JobSheetProduct.findOne({
        where: {
          jobSheetId,
          productId: data.productId,
        },
        transaction,
      });

      if (existingProduct) {
        throw new AppError(400, 'Product already added to this job sheet');
      }

      // Check inventory availability at the job sheet's location
      const inventory = await ProductInventory.findOne({
        where: {
          productId: data.productId,
          locationId: jobSheet.locationId,
        },
        transaction,
      });

      const quantity = data.quantity || 1;
      const availableStock = inventory?.quantity || 0;

      if (availableStock < quantity) {
        throw new AppError(400, `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`);
      }

      // Calculate total cost
      const unitPrice = data.unitPrice || product.unitPrice;
      const totalCost = quantity * unitPrice;

      // Create job sheet product
      const jobSheetProduct = await JobSheetProduct.create({
        jobSheetId,
        productId: data.productId,
        quantity,
        unitPrice,
        costPrice: data.costPrice,
        totalPrice: totalCost,
        warrantyMonths: data.warrantyMonths || 0,
        serialNumber: data.serialNumber,
        batchNumber: data.batchNumber,
        notes: data.notes,
      }, { transaction });

      // Update inventory
      if (inventory) {
        await inventory.update({
          quantity: inventory.quantity - quantity,
        }, { transaction });
      }

      // Update job sheet parts cost (products are treated as parts in cost calculation)
      const currentPartsCost = jobSheet.partsCost || 0;
      const newPartsCost = currentPartsCost + totalCost;
      const newTotalAmount = this.calculateTotal(
        jobSheet.labourCost,
        newPartsCost,
        jobSheet.discountAmount
      );

      await jobSheet.update({
        partsCost: newPartsCost,
        actualCost: jobSheet.labourCost + newPartsCost,
        totalAmount: newTotalAmount,
        balanceAmount: newTotalAmount - jobSheet.paidAmount,
      }, { transaction });

      await transaction.commit();

      // Return with product details
      await jobSheetProduct.reload({
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'product_code', 'name', 'unit_price', 'cost_price'],
          },
        ],
      });

      return jobSheetProduct.toJSON();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Remove product from job sheet
   */
  async removeProductFromJobSheet(jobSheetId: string, productId: string) {
    const transaction = await sequelize.transaction();

    try {
      // Verify job sheet product exists
      const jobSheetProduct = await JobSheetProduct.findOne({
        where: {
          jobSheetId,
          productId,
        },
        transaction,
      });

      if (!jobSheetProduct) {
        throw new AppError(404, 'Product not found in job sheet');
      }

      // Get job sheet
      const jobSheet = await JobSheet.findByPk(jobSheetId, { transaction });
      if (!jobSheet) {
        throw new AppError(404, 'Job sheet not found');
      }

      const productCost = jobSheetProduct.totalPrice;
      const quantity = jobSheetProduct.quantity;

      // Return product to inventory
      const inventory = await ProductInventory.findOne({
        where: {
          productId,
          locationId: jobSheet.locationId,
        },
        transaction,
      });

      if (inventory) {
        await inventory.update({
          quantity: inventory.quantity + quantity,
        }, { transaction });
      }

      // Remove the product
      await jobSheetProduct.destroy({ transaction });

      // Update job sheet costs
      const newPartsCost = jobSheet.partsCost - productCost;
      const newTotalAmount = this.calculateTotal(
        jobSheet.labourCost,
        newPartsCost,
        jobSheet.discountAmount
      );

      await jobSheet.update({
        partsCost: newPartsCost,
        actualCost: jobSheet.labourCost + newPartsCost,
        totalAmount: newTotalAmount,
        balanceAmount: newTotalAmount - jobSheet.paidAmount,
      }, { transaction });

      await transaction.commit();

      return { message: 'Product removed from job sheet successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get job sheet products
   */
  async getJobSheetProducts(jobSheetId: string) {
    // Verify job sheet exists
    const jobSheet = await JobSheet.findByPk(jobSheetId);
    if (!jobSheet) {
      throw new AppError(404, 'Job sheet not found');
    }

    const jobSheetProducts = await JobSheetProduct.findAll({
      where: { jobSheetId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'product_code', 'name', 'unit_price', 'cost_price', 'sku'],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    return {
      jobSheet: {
        id: jobSheet.id,
        jobNumber: jobSheet.jobNumber,
      },
      products: jobSheetProducts.map(jsp => jsp.toJSON()),
    };
  }

  /**
   * Update product status in job sheet
   */
  async updateProductStatus(
    jobSheetId: string,
    productId: string,
    status: 'PENDING' | 'USED' | 'RETURNED',
    quantityUsed?: number
  ) {
    const transaction = await sequelize.transaction();

    try {
      // Verify job sheet product exists
      const jobSheetProduct = await JobSheetProduct.findOne({
        where: {
          jobSheetId,
          productId,
        },
        transaction,
      });

      if (!jobSheetProduct) {
        throw new AppError(404, 'Product not found in job sheet');
      }

      // Get job sheet for location info
      const jobSheet = await JobSheet.findByPk(jobSheetId, { transaction });
      if (!jobSheet) {
        throw new AppError(404, 'Job sheet not found');
      }

      const oldStatus = jobSheetProduct.status;
      const updateData: any = { status };

      // Handle status-specific logic
      if (status === 'USED') {
        // If marking as used, check quantity used
        const actualQuantityUsed = quantityUsed || jobSheetProduct.quantity;

        if (actualQuantityUsed > jobSheetProduct.quantity) {
          throw new AppError(400, 'Quantity used cannot exceed allocated quantity');
        }

        updateData.quantityUsed = actualQuantityUsed;

        // If not all quantity was used, return the remainder to inventory
        if (actualQuantityUsed < jobSheetProduct.quantity) {
          const remainder = jobSheetProduct.quantity - actualQuantityUsed;

          const inventory = await ProductInventory.findOne({
            where: {
              productId,
              locationId: jobSheet.locationId,
            },
            transaction,
          });

          if (inventory) {
            await inventory.update({
              quantity: inventory.quantity + remainder,
            }, { transaction });
          }

          // Update the allocated quantity
          updateData.quantity = actualQuantityUsed;
          updateData.totalCost = actualQuantityUsed * jobSheetProduct.unitPrice;
        }
      } else if (status === 'RETURNED') {
        // Return all quantity to inventory
        const inventory = await ProductInventory.findOne({
          where: {
            productId,
            locationId: jobSheet.locationId,
          },
          transaction,
        });

        if (inventory) {
          await inventory.update({
            quantity: inventory.quantity + jobSheetProduct.quantity,
          }, { transaction });
        }

        // Remove from job sheet costs
        const productCost = jobSheetProduct.totalPrice;
        const newPartsCost = jobSheet.partsCost - productCost;
        const newTotalAmount = this.calculateTotal(
          jobSheet.labourCost,
          newPartsCost,
          jobSheet.discountAmount
        );

        await jobSheet.update({
          partsCost: newPartsCost,
          actualCost: jobSheet.labourCost + newPartsCost,
          totalAmount: newTotalAmount,
          balanceAmount: newTotalAmount - jobSheet.paidAmount,
        }, { transaction });

        // Mark for removal after transaction
        updateData.markForDeletion = true;
      }

      await jobSheetProduct.update(updateData, { transaction });

      // If marked for deletion, remove it
      if (updateData.markForDeletion) {
        await jobSheetProduct.destroy({ transaction });
      }

      await transaction.commit();

      return {
        message: `Product status updated from ${oldStatus} to ${status}`,
        jobSheetProduct: jobSheetProduct.toJSON(),
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Download job sheet as PDF
   */
  async downloadJobSheet(jobSheetId: string, options: DownloadJobSheetDTO): Promise<Buffer> {
    const jobSheet = await JobSheet.findByPk(jobSheetId, {
      include: [
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: Device,
          as: 'device',
        },
        {
          model: Location,
          as: 'location',
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: JobSheetPart,
          as: 'parts',
          include: [
            {
              model: Part,
              as: 'part',
            },
          ],
        },
        {
          model: JobSheetProduct,
          as: 'products',
          include: [
            {
              model: Product,
              as: 'product',
            },
          ],
        },
      ],
    });

    if (!jobSheet) {
      throw new AppError(404, 'Job sheet not found');
    }

    return this.generateJobSheetPDF(jobSheet.toJSON(), options);
  }

  /**
   * Print job sheet (returns PDF buffer for printing)
   */
  async printJobSheet(jobSheetId: string, options: PrintJobSheetDTO): Promise<Buffer> {
    const jobSheet = await JobSheet.findByPk(jobSheetId, {
      include: [
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: Device,
          as: 'device',
        },
        {
          model: Location,
          as: 'location',
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: JobSheetPart,
          as: 'parts',
          include: [
            {
              model: Part,
              as: 'part',
            },
          ],
        },
        {
          model: JobSheetProduct,
          as: 'products',
          include: [
            {
              model: Product,
              as: 'product',
            },
          ],
        },
      ],
    });

    if (!jobSheet) {
      throw new AppError(404, 'Job sheet not found');
    }

    return this.generateJobSheetPDF(jobSheet.toJSON(), options);
  }

 private async generateJobSheetPDF(
  jobSheet: any,
  options: DownloadJobSheetDTO | PrintJobSheetDTO
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const business = await Business.findOne();
      const businessData = business ? business.toJSON() : null;

      const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        layout: 'portrait'
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: any) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const bottomMargin = 140; // Increased for signature section
      const CLOUDINARY_BASE_URL = process.env.CLOUDINARY_BASE_URL || 'https://res.cloudinary.com';

      // ===== HEADER =====
      doc.rect(0, 0, pageWidth, 120).fill('#1e40af');

      // Logo on the RIGHT side
      if (businessData?.logo) {
        try {
          const logoUrl = `${CLOUDINARY_BASE_URL}${businessData.logo}`;
          const res = await axios.get(logoUrl, { responseType: 'arraybuffer' });
          doc.image(Buffer.from(res.data), pageWidth - 120, 25, { width: 90, height: 70 });
        } catch (err) { /* ignore */ }
      }

      // Left side text
      doc.fillColor('white');
      doc.fontSize(24).font('Helvetica-Bold').text(`JOB SHEET  ${jobSheet.jobNumber}`, 35, 20);
      doc.fontSize(16).font('Helvetica-Bold').text(businessData?.name || 'Lanka Tech Solutions', 35, 48);

      let contactY = 72;
      doc.fontSize(10).font('Helvetica');

      const address = (businessData?.address || 'No.43, High Level Road, Kirullapone, Colombo 06.').trim().replace(/\s+/g, ' ');
      const phone = businessData?.telephone?.trim() || '0769781811';
      const email = businessData?.email?.trim() || 'lts@gmail.com';

      doc.text(address, 35, contactY, { width: pageWidth - 200, lineBreak: true });
      contactY += doc.heightOfString(address, { width: pageWidth - 200 }) + 8;
      doc.text(phone, 35, contactY, { width: pageWidth - 200 });
      contactY += 18;
      doc.text(email, 35, contactY, { width: pageWidth - 200 });

      let y = 135;

      // ===== CUSTOMER + DEVICE INFO =====
      const colWidth = (pageWidth - 80) / 2;

      doc.rect(30, y, colWidth, 84).fill('#f8fafc').stroke('#94a3b8');
      doc.fillColor('#1e40af').fontSize(10.5).font('Helvetica-Bold').text('CUSTOMER INFO', 36, y + 8);
      doc.fillColor('#333').fontSize(9).font('Helvetica')
        .text(`Name: ${jobSheet.customer?.name || 'N/A'}`, 36, y + 22)
        .text(`Phone: ${jobSheet.customer?.phone || 'N/A'}`, 36, y + 36)
        .text(`Email: ${jobSheet.customer?.email || 'N/A'}`, 36, y + 50)
        .text(`Address: ${jobSheet.customer?.address || 'null'}`, 36, y + 64);

      doc.rect(40 + colWidth, y, colWidth, 84).fill('#ffffff').stroke('#94a3b8');
      doc.fillColor('#1e40af').fontSize(10.5).font('Helvetica-Bold').text('DEVICE INFO', 46 + colWidth, y + 8);
      
      // Add Job Number in device info section
      // doc.fillColor('#d97706').fontSize(9).font('Helvetica-Bold')
      //   .text(`Job #: ${jobSheet.jobNumber}`, 46 + colWidth, y + 22);
      
      doc.fillColor('#333').fontSize(9).font('Helvetica')
        .text(`${jobSheet.device?.deviceType?.charAt(0).toUpperCase() + jobSheet.device.deviceType.slice(1).toLowerCase() || 'N/A'} | ${jobSheet.device?.brand || 'N/A'}`, 46 + colWidth, y + 22)
        .text(`Model: ${jobSheet.device?.model || 'N/A'} | Serial: ${jobSheet.device?.serialNumber || 'N/A'}`, 46 + colWidth, y + 36);

      y += 102;

      // ===== STATUS BAR =====
      doc.rect(30, y, pageWidth - 60, 22).fill('#f0f9ff').stroke('#94a3b8');
      doc.fillColor('#333').fontSize(9).font('Helvetica')
        .text(`Status: ${jobSheet.status}`, 36, y + 7)
        .text(`Priority: ${jobSheet.priority}`, 180, y + 7)
        .text(`Received: ${new Date(jobSheet.receivedDate).toLocaleDateString()}`, 300, y + 7)
        .text(`Expected: ${jobSheet.expectedDate ? new Date(jobSheet.expectedDate).toLocaleDateString() : 'TBD'}`, 440, y + 7);

      y += 32;

      // ===== ISSUE DESCRIPTION =====
      doc.fillColor('#1e40af').fontSize(10).font('Helvetica-Bold').text('ISSUE DESCRIPTION', 30, y);
      y += 14;

      const issueHeight = 50;
      doc.rect(30, y, pageWidth - 60, issueHeight).strokeColor('#cbd5e1').stroke();
      doc.fillColor('#333').fontSize(9).font('Helvetica')
        .text(jobSheet.issueDescription || 'N/A', 36, y + 8, {
          width: pageWidth - 72,
          height: issueHeight - 16,
          align: 'left',
          lineGap: 3
        });

      y += issueHeight + 14;

      // ===== ACCESSORIES SECTION =====
      doc.fillColor('#1e40af').fontSize(10).font('Helvetica-Bold').text('ACCESSORIES', 30, y);
      y += 14;

      const accessoriesHeight = 35;
      doc.strokeColor('#cbd5e1').lineWidth(1);
      doc.rect(30, y, pageWidth - 60, accessoriesHeight).stroke();
      doc.fillColor('#333').fontSize(9).font('Helvetica')
        .text(jobSheet.accessories, 36, y + 8, {
          width: pageWidth - 72,
          height: accessoriesHeight - 16,
          align: 'left'
        });

      y += accessoriesHeight + 14;

    

      // ===== PARTS & PRODUCTS =====
      // if ((jobSheet.parts?.length || 0) + (jobSheet.products?.length || 0) > 0) {
      //   doc.fillColor('#1e40af').fontSize(10).font('Helvetica-Bold').text('PARTS & PRODUCTS USED', 30, y);
      //   y += 14;

      //   doc.fillColor('#333').fontSize(8.5).font('Helvetica');
      //   let index = 1;
      //   [...(jobSheet.parts || []), ...(jobSheet.products || [])].forEach((item: any) => {
      //     const name = item.part?.name || item.product?.name || 'N/A';
      //     doc.text(`${index++}. ${name} - Qty: ${item.quantity} - Rs. ${Number(item.totalPrice).toFixed(2)}`, 40, y);
      //     y += 13;
      //   });
      //   y += 8;
      // }


      

      // ===== FINANCIAL SUMMARY =====
      doc.strokeColor('#1e40af').lineWidth(1.5);
      doc.rect(30, y, pageWidth - 60, 65).fill('#f0f9ff').stroke();
      
      doc.fillColor('#1e40af').fontSize(10.5).font('Helvetica-Bold').text('FINANCIAL SUMMARY', 36, y + 10);

      doc.fillColor('#333').fontSize(9.5).font('Helvetica')
        .text(`Labour: Rs. ${Number(jobSheet.labourCost).toFixed(2)}`, 36, y + 26)
        .text(`Parts/Products: Rs. ${Number(jobSheet.partsCost).toFixed(2)}`, 200, y + 26)
        .text(`Discount: Rs. ${Number(jobSheet.discountAmount).toFixed(2)}`, 380, y + 26);

      doc.strokeColor('#1e40af').lineWidth(1);
      doc.moveTo(36, y + 42).lineTo(pageWidth - 36, y + 42).stroke();

      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#1e40af')
        .text(`Total: Rs. ${Number(jobSheet.totalAmount).toFixed(2)}`, 36, y + 48);
      
      doc.fillColor('#1e40af')
        .text(`Paid: Rs. ${Number(jobSheet.paidAmount).toFixed(2)}`, 200, y + 48);
      
      doc.fillColor('#d97706')
        .text(`Balance: Rs. ${Number(jobSheet.balanceAmount).toFixed(2)}`, 380, y + 48);

      y += 28;

        // ===== DEVICE CONDITION DIAGRAMS =====
      // doc.fillColor('#1e40af').fontSize(10).font('Helvetica-Bold').text('DEVICE CONDITION', 30, y);
      y += 34;

      // Load and display device condition image
      try {
        const imagePath = path.join(__dirname, '../../../public/divice_condi.jpeg');
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const frameHeight = 250;
          const totalFrameWidth = 230 + 25 + 230 + 60 + 60 + 30; // Approximate width
          const startX = (pageWidth - totalFrameWidth) / 2;
          doc.image(imageBuffer, startX, y, { width: totalFrameWidth, height: frameHeight });
          y += frameHeight + 18;
        } else {
          // Fallback: draw simple frames if image not found
          const frameWidth = 180;
          const frameHeight = 140;
          const frameSpacing = 25;
          const sideFrameWidth = 60;
          const totalFrameWidth = sideFrameWidth + frameWidth + frameSpacing + frameWidth + sideFrameWidth + 30;
          const startX = (pageWidth - totalFrameWidth) / 2;
          doc.strokeColor('#333333').lineWidth(1);
          doc.roundedRect(startX + sideFrameWidth + 10, y, frameWidth, frameHeight, 8).stroke();
          doc.roundedRect(startX + sideFrameWidth + 10 + frameWidth + frameSpacing, y, frameWidth, frameHeight, 8).stroke();
          y += frameHeight + 18;
        }
      } catch (err) {
        // Fallback: draw simple frames if error
        const frameWidth = 180;
        const frameHeight = 140;
        const frameSpacing = 25;
        const sideFrameWidth = 60;
        const totalFrameWidth = sideFrameWidth + frameWidth + frameSpacing + frameWidth + sideFrameWidth + 30;
        const startX = (pageWidth - totalFrameWidth) / 2;
        doc.strokeColor('#333333').lineWidth(1);
        doc.roundedRect(startX + sideFrameWidth + 10, y, frameWidth, frameHeight, 8).stroke();
        doc.roundedRect(startX + sideFrameWidth + 10 + frameWidth + frameSpacing, y, frameWidth, frameHeight, 8).stroke();
        y += frameHeight + 18;
      }

      // ===== SIGNATURE SECTION AT BOTTOM =====
      const signatureY = pageHeight - bottomMargin - 60;
      
      // Signature boxes
      const sigBoxWidth = (pageWidth - 120) / 3;
      const sigBoxHeight = 50;
      const sigStartY = signatureY + 12;

      // Prepared by
      doc.strokeColor('#94a3b8').lineWidth(1);
      doc.moveTo(50, sigStartY + sigBoxHeight).lineTo(50 + sigBoxWidth - 40, sigStartY + sigBoxHeight).stroke();
      doc.fillColor('#333').fontSize(9).font('Helvetica-Bold')
        .text('Prepared by', 50, sigStartY + sigBoxHeight + 6, { width: sigBoxWidth - 40, align: 'center' });

      // Checked by
      const checkedX = 50 + sigBoxWidth + 10;
      doc.moveTo(checkedX, sigStartY + sigBoxHeight).lineTo(checkedX + sigBoxWidth - 40, sigStartY + sigBoxHeight).stroke();
      doc.fillColor('#333').fontSize(9).font('Helvetica-Bold')
        .text('Checked by', checkedX, sigStartY + sigBoxHeight + 6, { width: sigBoxWidth - 40, align: 'center' });

      // Customer Signature
      const customerX = checkedX + sigBoxWidth + 10;
      doc.moveTo(customerX, sigStartY + sigBoxHeight).lineTo(customerX + sigBoxWidth - 40, sigStartY + sigBoxHeight).stroke();
      doc.fillColor('#333').fontSize(9).font('Helvetica-Bold')
        .text('Customer Signature', customerX, sigStartY + sigBoxHeight + 6, { width: sigBoxWidth - 40, align: 'center' });

      // Divider line after signatures
      const dividerY = sigStartY + sigBoxHeight + 50;
      doc.strokeColor('#94a3b8').lineWidth(1);
      doc.moveTo(30, dividerY).lineTo(pageWidth - 30, dividerY).stroke();

      // ===== FOOTER =====
      const footerY = dividerY + 5; // Place footer below the divider

      doc.fontSize(7).fillColor('#666666').font('Helvetica')
        .text(`Generated on ${new Date().toLocaleString()} | ${businessData?.name || 'Lanka Tech Solutions'}`, 30, footerY, {
          align: 'center',
          width: pageWidth - 0
        });

      doc.fontSize(9.5).fillColor('#1e40af').font('Helvetica-Bold')
        .text('Solutions by Divenzainc.com', 30, footerY + 14, {
          align: 'center',
          width: pageWidth - 0
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
}

