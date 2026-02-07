import prisma from '../../shared/config/database';
import { AppError } from '../../shared/utils/app-error';
import { withPrismaErrorHandling } from '../../shared/utils/sequelize-error-handler';
import {
  CreateJobSheetDTO,
  UpdateJobSheetDTO,
  UpdateJobSheetStatLKRTO,
  JobSheetQueryDTO,
  AddPartToJobSheetDTO,
  AddProductToJobSheetDTO,
} from './jobsheet.dto';
import { NotificationOrchestrator } from '../notification/notification-orchestrator.service';

// export class JobSheetService {
//   private notificationOrchestrator = new NotificationOrchestrator();
//   /**
//    * Generate next job number in format JS-2025-0001
//    */
//   private async generateJobNumber(): Promise<string> {
//     const year = new Date().getFullYear();
//     const prefix = `JS-${year}-`;

//     const lastJob = await prisma.jobSheet.findFirst({
//       where: {
//         jobNumber: { startsWith: prefix },
//       },
//       orderBy: { jobNumber: 'desc' },
//       select: { jobNumber: true },
//     });

//     if (!lastJob) {
//       return `${prefix}0001`;
//     }

//     const lastNumber = parseInt(lastJob.jobNumber.split('-')[2], 10);
//     const nextNumber = lastNumber + 1;
//     return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
//   }

//   /**
//    * Calculate total amount
//    */
//   private calculateTotal(
//     labourCost: number,
//     partsCost: number,
//     discountAmount: number
//   ): number {
//     return labourCost + partsCost - discountAmount;
//   }

//   /**
//    * Create a new job sheet
//    */
//   async createJobSheet(data: CreateJobSheetDTO, createdById: string) {
//     // Verify customer exists
//     const customer = await prisma.customer.findUnique({
//       where: { id: data.customerId },
//     });
//     if (!customer) {
//       throw new AppError(404, 'Customer not found');
//     }

//     // Verify device exists and belongs to customer
//     const device = await prisma.device.findUnique({
//       where: { id: data.deviceId },
//     });
//     if (!device) {
//       throw new AppError(404, 'Device not found');
//     }
//     if (device.customerId !== data.customerId) {
//       throw new AppError(400, 'Device does not belong to this customer');
//     }

//     // Verify location exists
//     const location = await prisma.location.findUnique({
//       where: { id: data.locationId },
//     });
//     if (!location) {
//       throw new AppError(404, 'Location not found');
//     }

//     // Verify assigned user if provided
//     if (data.assignedToId) {
//       const user = await prisma.user.findUnique({
//         where: { id: data.assignedToId },
//       });
//       if (!user) {
//         throw new AppError(404, 'Assigned user not found');
//       }
//     }

//     const jobNumber = await this.generateJobNumber();
    
//     // Calculate costs
//     const labourCost = data.labourCost || 0;
//     const partsCost = data.partsCost || 0;
//     const discountAmount = data.discountAmount || 0;
//     const paidAmount = data.paidAmount || 0;
    
//     // Total amount = labourCost + partsCost - discountAmount
//     const totalAmount = this.calculateTotal(labourCost, partsCost, discountAmount);
    
//     // Actual cost is the sum of labour and parts (before discount)
//     const actualCost = labourCost + partsCost;
    
//     // Estimated cost can be set explicitly or default to actual cost
//     const estimatedCost = data.estimatedCost || actualCost;
    
//     // Balance amount = totalAmount - paidAmount
//     const balanceAmount = totalAmount - paidAmount;

//     // Calculate warranty expiry if warranty period is provided
//     const warrantyExpiry = data.warrantyPeriod
//       ? new Date(Date.now() + data.warrantyPeriod * 24 * 60 * 60 * 1000)
//       : null;

//     const jobSheet = await prisma.jobSheet.create({
//       data: {
//         jobNumber,
//         customerId: data.customerId,
//         deviceId: data.deviceId,
//         locationId: data.locationId,
//         createdById,
//         assignedToId: data.assignedToId,
//         issueDescription: data.issueDescription,
//         customerRemarks: data.customerRemarks,
//         technicianRemarks: data.technicianRemarks,
//         deviceCondition: data.deviceCondition,
//         accessories: data.accessories,
//         devicePassword: data.devicePassword,
//         backupTaken: data.backupTaken,
//         status: data.status || 'PENDING',
//         priority: data.priority || 'NORMAL',
//         // Accept either `expectedDate` or `expectedCompletionDate` (frontend alias)
//         expectedDate: data.expectedDate
//           ? new Date(data.expectedDate)
//           : data.expectedCompletionDate
//           ? new Date(data.expectedCompletionDate)
//           : null,
//         estimatedCost,
//         actualCost,
//         labourCost,
//         partsCost,
//         discountAmount,
//         totalAmount,
//         paidAmount,
//         balanceAmount,
//         warrantyPeriod: data.warrantyPeriod,
//         warrantyExpiry,
//       },
//       include: {
//         customer: {
//           select: {
//             id: true,
//             customerId: true,
//             name: true,
//             phone: true,
//             email: true,
//           },
//         },
//         device: true,
//         location: {
//           select: {
//             id: true,
//             name: true,
//             address: true,
//             phone: true,
//           },
//         },
//         createdBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//         assignedTo: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     // Create status history
//     await prisma.jobStatusHistory.create({
//       data: {
//         jobSheetId: jobSheet.id,
//         toStatus: jobSheet.status,
//         remarks: 'Job sheet created',
//       },
//     });

//     // Send creation notifications (Customer + Admin)
//     try {
//       await this.notificationOrchestrator.createJobSheetNotifications(
//         jobSheet.id,
//         jobSheet.customerId,
//         jobSheet.locationId,
//         {
//           customerName: jobSheet.customer.name,
//           jobSheetNumber: jobSheet.jobNumber,
//           estimatedCost: jobSheet.estimatedCost?.toFixed(2) || '0.00',
//           locationName: jobSheet.location.name,
//           companyName: 'LTS Phone Shop',
//           contactPhone: jobSheet.location.phone || '',
//         }
//       );
//     } catch (notificationError) {
//       console.error('Error sending job sheet creation notifications:', notificationError);
//     }

//     return jobSheet;
//   }

//   /**
//    * Get all job sheets with pagination and filters
//    */
//   async getJobSheets(query: JobSheetQueryDTO) {
//     const page = parseInt(query.page) || 1;
//     const limit = parseInt(query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const where: any = {};

//     if (query.search) {
//       where.OR = [
//         { jobNumber: { contains: query.search, mode: 'insensitive' } },
//         { customer: { name: { contains: query.search, mode: 'insensitive' } } },
//         { customer: { phone: { contains: query.search } } },
//         { device: { brand: { contains: query.search, mode: 'insensitive' } } },
//         { device: { model: { contains: query.search, mode: 'insensitive' } } },
//       ];
//     }

//     if (query.status) {
//       where.status = query.status;
//     }

//     if (query.priority) {
//       where.priority = query.priority;
//     }

//     if (query.locationId) {
//       where.locationId = query.locationId;
//     }

//     if (query.customerId) {
//       where.customerId = query.customerId;
//     }

//     if (query.assignedToId) {
//       where.assignedToId = query.assignedToId;
//     }

//     if (query.fromDate || query.toDate) {
//       where.receivedDate = {};
//       if (query.fromDate) {
//         where.receivedDate.gte = new Date(query.fromDate);
//       }
//       if (query.toDate) {
//         where.receivedDate.lte = new Date(query.toDate);
//       }
//     }

//     const [jobSheets, total] = await Promise.all([
//       prisma.jobSheet.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: { receivedDate: 'desc' },
//         include: {
//           customer: {
//             select: {
//               id: true,
//               customerId: true,
//               name: true,
//               phone: true,
//               email: true,
//             },
//           },
//           device: {
//             select: {
//               id: true,
//               deviceType: true,
//               brand: true,
//               model: true,
//               serialNumber: true,
//             },
//           },
//           location: {
//             select: {
//               id: true,
//               name: true,
//              address: true,
//             },
//           },
//           assignedTo: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//             },
//           },
//           _count: {
//             select: {
//               repairs: true,
//               parts: true,
//               payments: true,
//             },
//           },
//         },
//       }),
//       prisma.jobSheet.count({ where }),
//     ]);

//     return {
//       jobSheets,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     };
//   }

//   /**
//    * Get job sheet by ID
//    */
//   async getJobSheetById(id: string) {
//     const jobSheet = await prisma.jobSheet.findUnique({
//       where: { id },
//       include: {
//         customer: {
//           select: {
//             id: true,
//             customerId: true,
//             name: true,
//             phone: true,
//             alternatePhone: true,
//             email: true,
//             address: true,
//             city: true,
//           },
//         },
//         device: true,
//         location: {
//           select: {
//             id: true,
//             name: true,
//             address: true,
//             phone: true,
//           },
//         },
//         createdBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//         assignedTo: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//         repairs: {
//           orderBy: { createdAt: 'desc' },
//         },
//         parts: {
//           include: {
//             part: {
//               select: {
//                 id: true,
//                 partNumber: true,
//                 name: true,
//                 category: true,
//               },
//             },
//           },
//         },
//         payments: {
//           orderBy: { paymentDate: 'desc' },
//           include: {
//             receivedBy: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//               },
//             },
//           },
//         },
//         statusHistory: {
//           orderBy: { changedAt: 'desc' },
//         },
//       },
//     });

//     if (!jobSheet) {
//       throw new AppError(404, 'Job sheet not found');
//     }

//     return jobSheet;
//   }

//   /**
//    * Get job sheet by job number
//    */
//   async getJobSheetByJobNumber(jobNumber: string) {
//     const jobSheet = await prisma.jobSheet.findUnique({
//       where: { jobNumber },
//       include: {
//         customer: true,
//         device: true,
//         location: true,
//         assignedTo: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     if (!jobSheet) {
//       throw new AppError(404, 'Job sheet not found');
//     }

//     return jobSheet;
//   }

//   /**
//    * Update job sheet
//    */
//   async updateJobSheet(id: string, data: UpdateJobSheetDTO) {
//     const existingJobSheet = await prisma.jobSheet.findUnique({
//       where: { id },
//     });

//     if (!existingJobSheet) {
//       throw new AppError(404, 'Job sheet not found');
//     }

//     // Verify assigned user if provided
//     if (data.assignedToId) {
//       const user = await prisma.user.findUnique({
//         where: { id: data.assignedToId },
//       });
//       if (!user) {
//         throw new AppError(404, 'Assigned user not found');
//       }
//     }

//     // Recalculate total if financial fields are updated
//     const updateData: any = { ...data };

//     // Handle frontend aliases: diagnosisNotes and repairNotes -> technicianRemarks
//     if ((data as any).diagnosisNotes !== undefined || (data as any).repairNotes !== undefined) {
//       const diagnosis = (data as any).diagnosisNotes;
//       const repair = (data as any).repairNotes;
      
//       // Combine both fields into technicianRemarks with clear sections
//       // Only set if at least one has content
//       if (diagnosis || repair) {
//         const parts: string[] = [];
//         if (diagnosis) parts.push(`DIAGNOSIS:\n${diagnosis}`);
//         if (repair) parts.push(`REPAIR NOTES:\n${repair}`);
//         updateData.technicianRemarks = parts.join('\n\n');
//       } else {
//         // Both are empty/null, set to null
//         updateData.technicianRemarks = null;
//       }
      
//       // Remove the frontend aliases from updateData
//       delete updateData.diagnosisNotes;
//       delete updateData.repairNotes;
//     }

//     // Map frontend MEDIUM priority to backend NORMAL
//     if ((data as any).priority === 'MEDIUM') {
//       updateData.priority = 'NORMAL';
//     }

//     // Recalculate financial fields if any financial data is updated
//     if (
//       data.labourCost !== undefined ||
//       data.partsCost !== undefined ||
//       data.discountAmount !== undefined ||
//       data.paidAmount !== undefined
//     ) {
//       const labourCost = data.labourCost ?? existingJobSheet.labourCost.toNumber();
//       const partsCost = data.partsCost ?? existingJobSheet.partsCost.toNumber();
//       const discountAmount = data.discountAmount ?? existingJobSheet.discountAmount.toNumber();
//       const paidAmount = data.paidAmount ?? existingJobSheet.paidAmount.toNumber();

//       // Calculate total amount
//       const totalAmount = this.calculateTotal(labourCost, partsCost, discountAmount);
//       updateData.totalAmount = totalAmount;
      
//       // Calculate actual cost (labour + parts before discount)
//       updateData.actualCost = labourCost + partsCost;
      
//       // Update paid amount if provided
//       if (data.paidAmount !== undefined) {
//         updateData.paidAmount = paidAmount;
//       }
      
//       // Calculate balance amount
//       updateData.balanceAmount = totalAmount - paidAmount;
//     }

//     // Update warranty expiry if warranty period is changed
//     if (data.warrantyPeriod !== undefined) {
//       updateData.warrantyExpiry = data.warrantyPeriod
//         ? new Date(Date.now() + data.warrantyPeriod * 24 * 60 * 60 * 1000)
//         : null;
//     }

//     // Convert date strings to Date objects. Support alias `expectedCompletionDate`.
//     if (data.expectedDate || (data as any).expectedCompletionDate) {
//       const expected = data.expectedDate ?? (data as any).expectedCompletionDate;
//       updateData.expectedDate = expected ? new Date(expected) : null;
//       // Remove the frontend alias from updateData to avoid Prisma error
//       delete updateData.expectedCompletionDate;
//     }
//     if (data.completedDate) {
//       updateData.completedDate = new Date(data.completedDate);
//     }
//     if (data.deliveredDate) {
//       updateData.deliveredDate = new Date(data.deliveredDate);
//     }

//     const jobSheet = await prisma.jobSheet.update({
//       where: { id },
//       data: updateData,
//       include: {
//         customer: {
//           select: {
//             id: true,
//             customerId: true,
//             name: true,
//             phone: true,
//           },
//         },
//         device: true,
//         location: {
//           select: {
//             id: true,
//             name: true,
//             phone: true,
//           },
//         },
//         assignedTo: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     // Send assignment notification if technician was assigned/changed
//     if (data.assignedToId && data.assignedToId !== existingJobSheet.assignedToId) {
//       try {
//         const technicianName = jobSheet.assignedTo?.name || 'Technician';
//         const deviceInfo = `${jobSheet.device.brand} ${jobSheet.device.model}`;
        
//         await this.notificationOrchestrator.createJobAssignmentNotifications(
//           jobSheet.id,
//           jobSheet.customerId,
//           data.assignedToId,
//           {
//             customerName: jobSheet.customer.name,
//             jobSheetNumber: jobSheet.jobNumber,
//             technicianName,
//             locationName: jobSheet.location.name,
//             companyName: 'LTS Phone Shop',
//             contactPhone: jobSheet.location.phone || '',
//           }
//         );
//       } catch (notificationError) {
//         console.error('Error sending job assignment notifications:', notificationError);
//       }
//     }

//     // Send price update notification if total amount changed
//     // Check if both exist and are different
//     const oldTotal = existingJobSheet.totalAmount?.toNumber() || 0;
//     const newTotal = jobSheet.totalAmount?.toNumber() || 0;
    
//     if (Math.abs(oldTotal - newTotal) > 0.01) {
//       try {
//         await this.notificationOrchestrator.createJobPriceUpdateNotifications(
//           jobSheet.id,
//           jobSheet.customerId,
//           {
//             customerName: jobSheet.customer.name,
//             jobSheetNumber: jobSheet.jobNumber,
//             oldAmount: oldTotal.toFixed(2),
//             newAmount: newTotal.toFixed(2),
//             locationName: jobSheet.location.name,
//             companyName: 'LTS Phone Shop',
//             contactPhone: jobSheet.location.phone || '',
//           }
//         );
//       } catch (notificationError) {
//         console.error('Error sending job price update notifications:', notificationError);
//       }
//     }

//     return jobSheet;
//   }

//   /**
//    * Update job sheet status
//    */
//   async updateJobSheetStatus(id: string, data: UpdateJobSheetStatLKRTO) {
//     const jobSheet = await prisma.jobSheet.findUnique({
//       where: { id },
//     });

//     if (!jobSheet) {
//       throw new AppError(404, 'Job sheet not found');
//     }

//     const updateData: any = {
//       status: data.status,
//     };

//     // Auto-update dates based on status
//     if (data.status === 'COMPLETED' && !jobSheet.completedDate) {
//       updateData.completedDate = new Date();
//     }
//     if (data.status === 'DELIVERED' && !jobSheet.deliveredDate) {
//       updateData.deliveredDate = new Date();
//     }

//     const updated = await prisma.jobSheet.update({
//       where: { id },
//       data: updateData,
//       include: {
//         customer: {
//           select: {
//             id: true,
//             customerId: true,
//             name: true,
//             phone: true,
//           },
//         },
//         device: true,
//         location: {
//           select: {
//             id: true,
//             name: true,
//             phone: true,
//           },
//         },
//       },
//     });

//     // Create status history
//     await prisma.jobStatusHistory.create({
//       data: {
//         jobSheetId: id,
//         fromStatus: jobSheet.status,
//         toStatus: data.status,
//         remarks: data.remarks,
//       },
//     });

//     // Send status change notifications
//     try {
//       const deviceInfo = `${updated.device.brand} ${updated.device.model}`;
//       const commonContext = {
//         customerName: updated.customer.name,
//         jobSheetNumber: updated.jobNumber,
//         locationName: updated.location.name,
//         companyName: 'LTS Phone Shop',
//         contactPhone: updated.location.phone || '',
//       };

//       switch (data.status) {
//         case 'COMPLETED':
//           await this.notificationOrchestrator.createJobCompletionNotifications(
//             updated.id,
//             updated.customerId,
//             updated.locationId,
//             {
//               ...commonContext,
//               completionDate: new Date().toLocaleDateString(),
//               totalAmount: updated.totalAmount?.toFixed(2) || '0.00',
//             }
//           );
//           break;

//         case 'WAITING_APPROVAL': // Mapped to DIAGNOSED
//           await this.notificationOrchestrator.createJobDiagnosedNotifications(
//             updated.id,
//             updated.customerId,
//             {
//               ...commonContext,
//               diagnosis: updated.technicianRemarks || 'Diagnosis completed',
//               estimatedCost: updated.estimatedCost?.toFixed(2) || 'TBD',
//             }
//           );
//           break;

//         case 'IN_PROGRESS': // Mapped to REPAIRING
//           await this.notificationOrchestrator.createJobRepairingNotifications(
//             updated.id,
//             updated.customerId,
//             {
//               ...commonContext,
//               deviceInfo,
//               estimatedCompletion: updated.expectedDate?.toLocaleDateString() || 'Soon',
//             }
//           );
//           break;

//         case 'READY_DELIVERY': // Mapped to READY_PICKUP
//           await this.notificationOrchestrator.createJobReadyPickupNotifications(
//             updated.id,
//             updated.customerId,
//             {
//               ...commonContext,
//               totalAmount: updated.totalAmount?.toFixed(2) || '0.00',
//               pickupLocation: updated.location.name,
//             }
//           );
//           break;

//         case 'DELIVERED':
//           await this.notificationOrchestrator.createJobDeliveredNotifications(
//             updated.id,
//             updated.customerId,
//             {
//               ...commonContext,
//               deliveryDate: new Date().toLocaleDateString(),
//               warrantyInfo: updated.warrantyExpiry ? `Warranty until ${updated.warrantyExpiry.toLocaleDateString()}` : 'No warranty',
//             }
//           );
//           break;

//         case 'CANCELLED':
//           await this.notificationOrchestrator.createJobCancellationNotifications(
//             updated.id,
//             updated.customerId,
//             {
//               ...commonContext,
//               reason: data.remarks || 'Cancelled by request',
//             }
//           );
//           break;

//         default:
//           // For other status changes - send general update notifications
//           await this.notificationOrchestrator.createJobSheetNotifications(
//             updated.id,
//             updated.customerId,
//             updated.locationId,
//             {
//               ...commonContext,
//               jobStatus: data.status,
//             }
//           );
//           break;
//       }
//     } catch (notificationError) {
//       console.error('Error sending job sheet status notifications:', notificationError);
//     }

//     return updated;
//   }

//   /**
//    * Add part to job sheet
//    */
//   async addPartToJobSheet(jobSheetId: string, data: AddPartToJobSheetDTO) {
//     const jobSheet = await prisma.jobSheet.findUnique({
//       where: { id: jobSheetId },
//     });

//     if (!jobSheet) {
//       throw new AppError(404, 'Job sheet not found');
//     }

//     const part = await prisma.part.findUnique({
//       where: { id: data.partId },
//     });

//     if (!part) {
//       throw new AppError(404, 'Part not found');
//     }

//     const totalPrice = data.unitPrice * data.quantity;

//     const jobSheetPart = await prisma.jobSheetPart.create({
//       data: {
//         jobSheetId,
//         partId: data.partId,
//         quantity: data.quantity,
//         unitPrice: data.unitPrice,
//         totalPrice,
//         warrantyMonths: data.warrantyMonths || 0,
//       },
//       include: {
//         part: {
//           select: {
//             id: true,
//             partNumber: true,
//             name: true,
//             category: true,
//           },
//         },
//       },
//     });

//     // Update job sheet parts cost
//     const newPartsCost = jobSheet.partsCost.toNumber() + totalPrice;
//     const newTotalAmount = this.calculateTotal(
//       jobSheet.labourCost.toNumber(),
//       newPartsCost,
//       jobSheet.discountAmount.toNumber()
//     );

//     await prisma.jobSheet.update({
//       where: { id: jobSheetId },
//       data: {
//         partsCost: newPartsCost,
//         totalAmount: newTotalAmount,
//         balanceAmount: newTotalAmount - jobSheet.paidAmount.toNumber(),
//       },
//     });

//     return jobSheetPart;
//   }

//   /**
//    * Remove part from job sheet
//    */
//   async removePartFromJobSheet(jobSheetId: string, jobSheetPartId: string) {
//     const jobSheetPart = await prisma.jobSheetPart.findUnique({
//       where: { id: jobSheetPartId },
//     });

//     if (!jobSheetPart || jobSheetPart.jobSheetId !== jobSheetId) {
//       throw new AppError(404, 'Part not found in this job sheet');
//     }

//     const jobSheet = await prisma.jobSheet.findUnique({
//       where: { id: jobSheetId },
//     });

//     if (!jobSheet) {
//       throw new AppError(404, 'Job sheet not found');
//     }

//     await prisma.jobSheetPart.delete({
//       where: { id: jobSheetPartId },
//     });

//     // Update job sheet parts cost
//     const newPartsCost =
//       jobSheet.partsCost.toNumber() - jobSheetPart.totalPrice.toNumber();
//     const newTotalAmount = this.calculateTotal(
//       jobSheet.labourCost.toNumber(),
//       newPartsCost,
//       jobSheet.discountAmount.toNumber()
//     );

//     await prisma.jobSheet.update({
//       where: { id: jobSheetId },
//       data: {
//         partsCost: newPartsCost,
//         totalAmount: newTotalAmount,
//         balanceAmount: newTotalAmount - jobSheet.paidAmount.toNumber(),
//       },
//     });

//     return { message: 'Part removed from job sheet successfully' };
//   }

//   /**
//    * Get job sheet statistics
//    */
//   async getJobSheetStats(locationId?: string) {
//     const where = locationId ? { locationId } : {};

//     const [
//       total,
//       pending,
//       inProgress,
//       waitingForParts,
//       readyForPickup,
//       completed,
//       delivered,
//       cancelled,
//       onHold,
//       byStatus,
//       byPriority,
//       financialAggregates,
//       todayFinancialAggregates,
//       monthFinancialAggregates,
//       posFinancialAggregates,
//       posTodayFinancialAggregates,
//       posMonthFinancialAggregates,
//     ] = await Promise.all([
//       prisma.jobSheet.count({ where }),
//       prisma.jobSheet.count({ where: { ...where, status: 'PENDING' } }),
//       prisma.jobSheet.count({ where: { ...where, status: 'IN_PROGRESS' } }),
//       prisma.jobSheet.count({ where: { ...where, status: 'WAITING_PARTS' } }),
//       prisma.jobSheet.count({ where: { ...where, status: 'READY_DELIVERY' } }),
//       prisma.jobSheet.count({ where: { ...where, status: 'COMPLETED' } }),
//       prisma.jobSheet.count({ where: { ...where, status: 'DELIVERED' } }),
//       prisma.jobSheet.count({ where: { ...where, status: 'CANCELLED' } }),
//       prisma.jobSheet.count({ where: { ...where, status: 'ON_HOLD' } }),
//       prisma.jobSheet.groupBy({
//         by: ['status'],
//         where,
//         _count: true,
//       }),
//       prisma.jobSheet.groupBy({
//         by: ['priority'],
//         where,
//         _count: true,
//       }),
//       prisma.jobSheet.aggregate({
//         where,
//         _sum: {
//           totalAmount: true,
//           paidAmount: true,
//           balanceAmount: true,
//         },
//         _count: true,
//       }),
//       prisma.jobSheet.aggregate({
//         where: {
//           ...where,
//           createdAt: {
//             gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
//             lt: new Date(new Date().setHours(23, 59, 59, 999)), // End of today
//           },
//         },
//         _sum: {
//           paidAmount: true,
//         },
//       }),
//       prisma.jobSheet.aggregate({
//         where: {
//           ...where,
//           createdAt: {
//             gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of month
//             lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), // Start of next month
//           },
//         },
//         _sum: {
//           paidAmount: true,
//         },
//       }),
//       // POS sales aggregates
//       prisma.sale.aggregate({
//         where: locationId ? { locationId, status: 'COMPLETED' } : { status: 'COMPLETED' },
//         _sum: {
//           totalAmount: true,
//         },
//       }),
//       prisma.sale.aggregate({
//         where: {
//           ...(locationId ? { locationId } : {}),
//           status: 'COMPLETED',
//           createdAt: {
//             gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
//             lt: new Date(new Date().setHours(23, 59, 59, 999)), // End of today
//           },
//         },
//         _sum: {
//           totalAmount: true,
//         },
//       }),
//       prisma.sale.aggregate({
//         where: {
//           ...(locationId ? { locationId } : {}),
//           status: 'COMPLETED',
//           createdAt: {
//             gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of month
//             lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), // Start of next month
//           },
//         },
//         _sum: {
//           totalAmount: true,
//         },
//       }),
//     ]);

//     const statusStats = byStatus.reduce((acc: any, item) => {
//       acc[item.status] = item._count;
//       return acc;
//     }, {});

//     const priorityStats = byPriority.reduce((acc: any, item) => {
//       acc[item.priority] = item._count;
//       return acc;
//     }, {});

//     const totalRevenue = Number(financialAggregates._sum.totalAmount || 0);
//     const totalAdvancePayments = Number(financialAggregates._sum.paidAmount || 0);
//     const totalBalance = Number(financialAggregates._sum.balanceAmount || 0);
//     const averageJobValue = financialAggregates._count > 0 ? totalRevenue / financialAggregates._count : 0;
//     const todayAdvancePayments = Number(todayFinancialAggregates._sum.paidAmount || 0) + Number(posTodayFinancialAggregates._sum.totalAmount || 0);
//     const monthAdvancePayments = Number(monthFinancialAggregates._sum.paidAmount || 0) + Number(posMonthFinancialAggregates._sum.totalAmount || 0);
//     const posTotalRevenue = Number(posFinancialAggregates._sum.totalAmount || 0);

//     return {
//       totalJobSheets: total,
//       pending,
//       inProgress,
//       waitingForParts,
//       readyForPickup,
//       completed: completed + delivered, // Combine COMPLETED and DELIVERED
//       cancelled,
//       onHold,
//       totalRevenue,
//       totalAdvancePayments,
//       totalBalance,
//       averageJobValue,
//       todayAdvancePayments,
//       monthAdvancePayments,
//       byStatus: statusStats,
//       byPriority: priorityStats,
//     };
//   }

//   /**
//    * Get overdue job sheets
//    */
//   async getOverdueJobSheets(locationId?: string) {
//     const where: any = {
//       expectedDate: {
//         lt: new Date(),
//       },
//       status: {
//         notIn: ['COMPLETED', 'DELIVERED', 'CANCELLED'],
//       },
//     };

//     if (locationId) {
//       where.locationId = locationId;
//     }

//     const jobSheets = await prisma.jobSheet.findMany({
//       where,
//       orderBy: { expectedDate: 'asc' },
//       include: {
//         customer: {
//           select: {
//             id: true,
//             customerId: true,
//             name: true,
//             phone: true,
//           },
//         },
//         device: {
//           select: {
//             deviceType: true,
//             brand: true,
//             model: true,
//           },
//         },
//         assignedTo: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//       },
//     });

//     return jobSheets;
//   }

//   /**
//    * Delete job sheet
//    */
//   async deleteJobSheet(id: string) {
//     const jobSheet = await prisma.jobSheet.findUnique({
//       where: { id },
//       include: {
//         _count: {
//           select: {
//             payments: true,
//           },
//         },
//       },
//     });

//     if (!jobSheet) {
//       throw new AppError(404, 'Job sheet not found');
//     }

//     if (jobSheet._count.payments > 0) {
//       throw new AppError(
//         400,
//         'Cannot delete job sheet with payments. Please cancel it instead.'
//       );
//     }

//     await prisma.jobSheet.delete({
//       where: { id },
//     });

//     return { message: 'Job sheet deleted successfully' };
//   }

//   /**
//    * Get job sheet status history
//    */
//   async getJobSheetStatusHistory(id: string) {
//     const jobSheet = await prisma.jobSheet.findUnique({
//       where: { id },
//     });

//     if (!jobSheet) {
//       throw new AppError(404, 'Job sheet not found');
//     }

//     const statusHistory = await prisma.jobStatusHistory.findMany({
//       where: { jobSheetId: id },
//       orderBy: { changedAt: 'asc' },
//       include: {
//         jobSheet: {
//           select: {
//             jobNumber: true,
//           },
//         },
//       },
//     });

//     return statusHistory;
//   }

//   /**
//    * Get job sheet payments
//    */
//   async getJobSheetPayments(id: string) {
//     const jobSheet = await prisma.jobSheet.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         jobNumber: true,
//         totalAmount: true,
//         paidAmount: true,
//         balanceAmount: true,
//       },
//     });

//     if (!jobSheet) {
//       throw new AppError(404, 'Job sheet not found');
//     }

//     const payments = await prisma.payment.findMany({
//       where: { jobSheetId: id },
//       orderBy: { paymentDate: 'desc' },
//       include: {
//         customer: {
//           select: {
//             id: true,
//             customerId: true,
//             name: true,
//             phone: true,
//           },
//         },
//         receivedBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     return {
//       jobSheet,
//       payments,
//       summary: {
//         totalAmount: jobSheet.totalAmount,
//         paidAmount: jobSheet.paidAmount,
//         balanceAmount: jobSheet.balanceAmount,
//         paymentCount: payments.length,
//       },
//     };
//   }

//   /**
//    * Add product to job sheet with stock reservation
//    */
//   async addProductToJobSheet(jobSheetId: string, data: AddProductToJobSheetDTO) {
//     // Verify job sheet exists
//     const jobSheet = await prisma.jobSheet.findUnique({
//       where: { id: jobSheetId },
//       include: {
//         location: true,
//       },
//     });

//     if (!jobSheet) {
//       throw new AppError(404, 'Job sheet not found');
//     }

//     // Verify product exists
//     const product = await prisma.product.findUnique({
//       where: { id: data.productId },
//     });

//     if (!product) {
//       throw new AppError(404, 'Product not found');
//     }

//     // Check product availability in location
//     const inventory = await prisma.productInventory.findUnique({
//       where: {
//         productId_locationId: {
//           productId: data.productId,
//           locationId: jobSheet.locationId,
//         },
//       },
//     });

//     if (!inventory) {
//       throw new AppError(
//         400,
//         `Product ${product.name} is not available in ${jobSheet.location.name}`
//       );
//     }

//     if (inventory.availableQuantity < data.quantity) {
//       throw new AppError(
//         400,
//         `Insufficient stock. Available: ${inventory.availableQuantity}, Requested: ${data.quantity}`
//       );
//     }

//     // Calculate costs
//     const totalPrice = data.unitPrice * data.quantity;

//     return await prisma.$transaction(async (tx) => {
//       // Create JobSheetProduct record
//       const jobSheetProduct = await tx.jobSheetProduct.create({
//         data: {
//           jobSheetId,
//           productId: data.productId,
//           quantity: data.quantity,
//           unitPrice: data.unitPrice,
//           costPrice: data.costPrice,
//           totalPrice,
//           warrantyMonths: data.warrantyMonths || 0,
//           serialNumber: data.serialNumber,
//           batchNumber: data.batchNumber,
//           status: 'RESERVED',
//           notes: data.notes,
//         },
//         include: {
//           product: {
//             select: {
//               id: true,
//               productCode: true,
//               name: true,
//               brand: true,
//               model: true,
//             },
//           },
//         },
//       });

//       // Reserve quantity from inventory
//       await tx.productInventory.update({
//         where: { id: inventory.id },
//         data: {
//           reservedQuantity: { increment: data.quantity },
//           availableQuantity: { decrement: data.quantity },
//         },
//       });

//       // Create stock movement record
//       await tx.productStockMovement.create({
//         data: {
//           productId: data.productId,
//           locationId: jobSheet.locationId,
//           movementType: 'RESERVATION',
//           quantity: data.quantity,
//           quantityBefore: inventory.quantity,
//           quantityAfter: inventory.quantity, // Physical quantity doesn't change on reservation
//           referenceType: 'JOB_SHEET',
//           referenceId: jobSheetId,
//           notes: `Reserved for Job Sheet ${jobSheet.jobNumber}`,
//         },
//       });

//       // Update job sheet costs
//       const newPartsCost = Number(jobSheet.partsCost) + totalPrice;
//       const newTotalAmount = Number(jobSheet.labourCost) + newPartsCost - Number(jobSheet.discountAmount);
//       const newBalanceAmount = newTotalAmount - Number(jobSheet.paidAmount);

//       await tx.jobSheet.update({
//         where: { id: jobSheetId },
//         data: {
//           partsCost: newPartsCost,
//           totalAmount: newTotalAmount,
//           balanceAmount: newBalanceAmount,
//         },
//       });

//       return jobSheetProduct;
//     });
//   }

//   /**
//    * Remove product from job sheet and release reservation
//    */
//   async removeProductFromJobSheet(jobSheetId: string, productId: string) {
//     // Find the job sheet product
//     const jobSheetProduct = await prisma.jobSheetProduct.findFirst({
//       where: {
//         jobSheetId,
//         productId,
//       },
//       include: {
//         jobSheet: {
//           include: {
//             location: true,
//           },
//         },
//         product: {
//           select: {
//             id: true,
//             productCode: true,
//             name: true,
//           },
//         },
//       },
//     });

//     if (!jobSheetProduct) {
//       throw new AppError(404, 'Product not found in job sheet');
//     }

//     // Check if product is already installed
//     if (jobSheetProduct.status === 'INSTALLED') {
//       throw new AppError(
//         400,
//         'Cannot remove installed product. Please mark it as returned first.'
//       );
//     }

//     return await prisma.$transaction(async (tx) => {
//       // Get inventory
//       const inventory = await tx.productInventory.findUnique({
//         where: {
//           productId_locationId: {
//             productId,
//             locationId: jobSheetProduct.jobSheet.locationId,
//           },
//         },
//       });

//       if (inventory) {
//         // Release reserved quantity
//         await tx.productInventory.update({
//           where: { id: inventory.id },
//           data: {
//             reservedQuantity: { decrement: jobSheetProduct.quantity },
//             availableQuantity: { increment: jobSheetProduct.quantity },
//           },
//         });

//         // Create stock movement record
//         await tx.productStockMovement.create({
//           data: {
//             productId,
//             locationId: jobSheetProduct.jobSheet.locationId,
//             movementType: 'RELEASE',
//             quantity: jobSheetProduct.quantity,
//             quantityBefore: inventory.quantity,
//             quantityAfter: inventory.quantity,
//             referenceType: 'JOB_SHEET',
//             referenceId: jobSheetId,
//             notes: `Released from Job Sheet ${jobSheetProduct.jobSheet.jobNumber}`,
//           },
//         });
//       }

//       // Update job sheet costs
//       const jobSheet = jobSheetProduct.jobSheet;
//       const newPartsCost = Number(jobSheet.partsCost) - Number(jobSheetProduct.totalPrice);
//       const newTotalAmount = Number(jobSheet.labourCost) + newPartsCost - Number(jobSheet.discountAmount);
//       const newBalanceAmount = newTotalAmount - Number(jobSheet.paidAmount);

//       await tx.jobSheet.update({
//         where: { id: jobSheetId },
//         data: {
//           partsCost: newPartsCost,
//           totalAmount: newTotalAmount,
//           balanceAmount: newBalanceAmount,
//         },
//       });

//       // Delete the job sheet product
//       await tx.jobSheetProduct.delete({
//         where: { id: jobSheetProduct.id },
//       });

//       return {
//         message: 'Product removed from job sheet successfully',
//         product: jobSheetProduct.product,
//         quantity: jobSheetProduct.quantity,
//       };
//     });
//   }

//   /**
//    * Get all products used in a job sheet
//    */
//   async getJobSheetProducts(jobSheetId: string) {
//     const jobSheet = await prisma.jobSheet.findUnique({
//       where: { id: jobSheetId },
//     });

//     if (!jobSheet) {
//       throw new AppError(404, 'Job sheet not found');
//     }

//     const products = await prisma.jobSheetProduct.findMany({
//       where: { jobSheetId },
//       orderBy: { createdAt: 'asc' },
//       include: {
//         product: {
//           select: {
//             id: true,
//             productCode: true,
//             sku: true,
//             name: true,
//             brand: true,
//             model: true,
//             category: {
//               select: {
//                 id: true,
//                 name: true,
//                 categoryCode: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     return products;
//   }

//   /**
//    * Update product status (e.g., mark as installed)
//    */
//   async updateProductStatus(
//     jobSheetId: string,
//     productId: string,
//     status: 'PENDING' | 'RESERVED' | 'INSTALLED' | 'RETURNED' | 'DEFECTIVE'
//   ) {
//     const jobSheetProduct = await prisma.jobSheetProduct.findFirst({
//       where: {
//         jobSheetId,
//         productId,
//       },
//       include: {
//         jobSheet: {
//           include: {
//             location: true,
//           },
//         },
//         product: true,
//       },
//     });

//     if (!jobSheetProduct) {
//       throw new AppError(404, 'Product not found in job sheet');
//     }

//     return await prisma.$transaction(async (tx) => {
//       // If marking as INSTALLED, consume the reserved stock
//       if (status === 'INSTALLED' && jobSheetProduct.status === 'RESERVED') {
//         const inventory = await tx.productInventory.findUnique({
//           where: {
//             productId_locationId: {
//               productId,
//               locationId: jobSheetProduct.jobSheet.locationId,
//             },
//           },
//         });

//         if (inventory) {
//           // Reduce reserved quantity and total quantity
//           await tx.productInventory.update({
//             where: { id: inventory.id },
//             data: {
//               quantity: { decrement: jobSheetProduct.quantity },
//               reservedQuantity: { decrement: jobSheetProduct.quantity },
//             },
//           });

//           // Create stock movement for actual usage
//           await tx.productStockMovement.create({
//             data: {
//               productId,
//               locationId: jobSheetProduct.jobSheet.locationId,
//               movementType: 'USAGE',
//               quantity: jobSheetProduct.quantity,
//               quantityBefore: inventory.quantity,
//               quantityAfter: inventory.quantity - jobSheetProduct.quantity,
//               referenceType: 'JOB_SHEET',
//               referenceId: jobSheetId,
//               notes: `Installed in Job Sheet ${jobSheetProduct.jobSheet.jobNumber}`,
//             },
//           });
//         }
//       }

//       // If marking as RETURNED from RESERVED, release the reservation
//       if (status === 'RETURNED' && jobSheetProduct.status === 'RESERVED') {
//         const inventory = await tx.productInventory.findUnique({
//           where: {
//             productId_locationId: {
//               productId,
//               locationId: jobSheetProduct.jobSheet.locationId,
//             },
//           },
//         });

//         if (inventory) {
//           await tx.productInventory.update({
//             where: { id: inventory.id },
//             data: {
//               reservedQuantity: { decrement: jobSheetProduct.quantity },
//               availableQuantity: { increment: jobSheetProduct.quantity },
//             },
//           });

//           await tx.productStockMovement.create({
//             data: {
//               productId,
//               locationId: jobSheetProduct.jobSheet.locationId,
//               movementType: 'RELEASE',
//               quantity: jobSheetProduct.quantity,
//               quantityBefore: inventory.quantity,
//               quantityAfter: inventory.quantity,
//               referenceType: 'JOB_SHEET',
//               referenceId: jobSheetId,
//               notes: `Returned from Job Sheet ${jobSheetProduct.jobSheet.jobNumber}`,
//             },
//           });
//         }
//       }

//       // Update the job sheet product status
//       const updatedProduct = await tx.jobSheetProduct.update({
//         where: { id: jobSheetProduct.id },
//         data: {
//           status,
//           installedDate: status === 'INSTALLED' ? new Date() : jobSheetProduct.installedDate,
//         },
//         include: {
//           product: {
//             select: {
//               id: true,
//               productCode: true,
//               name: true,
//               brand: true,
//               model: true,
//             },
//           },
//         },
//       });

//       return updatedProduct;
//     });
//   }
// }

