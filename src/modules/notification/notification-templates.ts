/**
 * Notification Templates for SMS and Email
 * Supports dynamic content rendering with template variables
 */

import { NotificationType, RecipientType } from '../../enums';

export interface TemplateContext {
  // Common fields
  customerName?: string;
  recipientName?: string;
  companyName?: string;
  locationName?: string;
  userName?: string;
  
  // Job Sheet fields
  jobSheetNumber?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  deviceInfo?: string; // Added
  jobStatus?: string;
  technicianName?: string;
  estimatedCost?: string;
  actualCost?: string;
  labourCost?: string; // Added
  partsCost?: string; // Added
  discountAmount?: string; // Added
  completionDate?: string;
  pickupDate?: string;
  diagnosis?: string; // Added
  pickupLocation?: string; // Added
  deliveryDate?: string; // Added
  warrantyInfo?: string; // Added
  oldAmount?: string; // Added
  newAmount?: string; // Added
  reason?: string; // Added (generic reason)
  estimatedCompletion?: string; // Added
  
  // Sales fields
  saleNumber?: string;
  totalAmount?: string;
  paidAmount?: string;
  balanceAmount?: string;
  itemCount?: number;
  itemsSummary?: string;
  discount?: string;
  paymentMethod?: string;
  
  // Return fields
  returnNumber?: string;
  returnReason?: string;
  productName?: string;
  quantity?: number;
  refundAmount?: string;
  returnStatus?: string;
  inspectionNotes?: string;
  resolutionType?: string;
  
  // Addon Request fields
  productCode?: string;
  currentQuantity?: string;
  requestedQuantity?: string;
  remark?: string;
  
  // Admin/Manager workflow fields
  actionRequired?: string;
  approvalStatus?: string;
  actionUrl?: string;
  priority?: string;
  previousValue?: string;
  newValue?: string;
  changedBy?: string;
  
  // Contact fields
  contactPhone?: string;
  contactEmail?: string;
}

export interface NotificationTemplate {
  type: NotificationType;
  recipientType: RecipientType;
  title: (context: TemplateContext) => string;
  smsTemplate: (context: TemplateContext) => string;
  emailTemplate?: (context: TemplateContext) => string;
  requiredFields: (keyof TemplateContext)[];
}

// ===========================================
// JOB SHEET TEMPLATES
// ===========================================

const JOB_CREATED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.JOB_CREATED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Job Created: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Your repair job ${ctx.jobSheetNumber} for ${ctx.deviceType} has been created. ` +
    `We'll notify you of progress. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'jobSheetNumber', 'deviceType', 'companyName']
};

const JOB_CREATED_ADMIN: NotificationTemplate = {
  type: NotificationType.JOB_CREATED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `New Job Created: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    ` New job ${ctx.jobSheetNumber} created for ${ctx.customerName}. ` +
    `Device: ${ctx.deviceType}. Location: ${ctx.locationName}. Requires assignment.`,
  requiredFields: ['jobSheetNumber', 'customerName', 'deviceType', 'locationName']
};

const JOB_STARTED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.JOB_STARTED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Job Started: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Great news! Work has started on your ${ctx.deviceType} repair job ${ctx.jobSheetNumber}. ` +
    `Technician: ${ctx.technicianName}. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'deviceType', 'jobSheetNumber', 'technicianName', 'companyName']
};

const JOB_COMPLETED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.JOB_COMPLETED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Job Completed: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Your ${ctx.deviceType} repair ${ctx.jobSheetNumber} is complete! ` +
    `Total: Rs.${ctx.actualCost}. Ready for pickup. Contact: ${ctx.contactPhone} - ${ctx.companyName}`,
  requiredFields: ['customerName', 'deviceType', 'jobSheetNumber', 'actualCost', 'contactPhone', 'companyName']
};

const JOB_COMPLETED_ADMIN: NotificationTemplate = {
  type: NotificationType.JOB_COMPLETED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Job Completed: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    ` Job ${ctx.jobSheetNumber} completed by ${ctx.technicianName}. ` +
    `Cost: Rs.${ctx.actualCost}. Customer: ${ctx.customerName}. Ready for pickup.`,
  requiredFields: ['jobSheetNumber', 'technicianName', 'actualCost', 'customerName']
};

const JOB_UPDATED_ADMIN: NotificationTemplate = {
  type: NotificationType.JOB_UPDATED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Job Updated: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    ` Job ${ctx.jobSheetNumber} updated. ` +
    `Changed by: ${ctx.changedBy}. Location: ${ctx.locationName}. Review required.`,
  requiredFields: ['jobSheetNumber', 'changedBy', 'locationName']
};

const JOB_STATUS_CHANGED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.JOB_STATUS_CHANGED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Job Status Update: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Status update for job ${ctx.jobSheetNumber}: ${ctx.jobStatus}. ` +
    `Your ${ctx.deviceType} repair is progressing. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'jobSheetNumber', 'jobStatus', 'deviceType', 'companyName']
};

const JOB_ASSIGNED_TECHNICIAN: NotificationTemplate = {
  type: NotificationType.JOB_ASSIGNED,
  recipientType: RecipientType.TECHNICIAN,
  title: (ctx) => `Job Assigned: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `[TECH] New job assigned: ${ctx.jobSheetNumber}. ` +
    `Device: ${ctx.deviceBrand} ${ctx.deviceModel}. Customer: ${ctx.customerName}. Priority: ${ctx.priority}`,
  requiredFields: ['jobSheetNumber', 'deviceBrand', 'deviceModel', 'customerName', 'priority']
};

const READY_PICKUP_CUSTOMER: NotificationTemplate = {
  type: NotificationType.JOB_READY_PICKUP,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Ready for Pickup: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Your ${ctx.deviceType} is ready for pickup! ` +
    `Job: ${ctx.jobSheetNumber}. Amount: Rs.${ctx.actualCost}. Contact: ${ctx.contactPhone} - ${ctx.companyName}`,
  requiredFields: ['customerName', 'deviceType', 'jobSheetNumber', 'actualCost', 'contactPhone', 'companyName']
};

const PAYMENT_RECEIVED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.PAYMENT_RECEIVED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Payment Received: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Thank you ${ctx.customerName}! Payment of Rs.${ctx.paidAmount} received for job ${ctx.jobSheetNumber}. ` +
    `Balance: Rs.${ctx.balanceAmount}. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'paidAmount', 'jobSheetNumber', 'balanceAmount', 'companyName']
};

const PAYMENT_RECEIVED_ADMIN: NotificationTemplate = {
  type: NotificationType.PAYMENT_RECEIVED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Payment Received: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Payment received: Rs.${ctx.paidAmount} for job ${ctx.jobSheetNumber}. ` +
    `Customer: ${ctx.customerName}. Balance: Rs.${ctx.balanceAmount}. Method: ${ctx.paymentMethod}.`,
  requiredFields: ['paidAmount', 'jobSheetNumber', 'customerName', 'balanceAmount', 'paymentMethod']
};

const JOB_REMINDER_CUSTOMER: NotificationTemplate = {
  type: NotificationType.JOB_REMINDER,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Reminder: Pickup Your Device`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Reminder: Your ${ctx.deviceType} (Job: ${ctx.jobSheetNumber}) is ready for pickup. ` +
    `Please collect it soon. Contact: ${ctx.contactPhone} - ${ctx.companyName}`,
  requiredFields: ['customerName', 'deviceType', 'jobSheetNumber', 'contactPhone', 'companyName']
};

// ===========================================
// SALES TEMPLATES
// ===========================================

const SALE_CREATED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.SALE_CREATED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Sale Created: ${ctx.saleNumber}`,
  smsTemplate: (ctx) => 
    `Thank you ${ctx.customerName}! Your purchase ${ctx.saleNumber} of ${ctx.itemCount} items has been created. ` +
    `Total: Rs.${ctx.totalAmount}. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'saleNumber', 'itemCount', 'totalAmount', 'companyName']
};

const SALE_CREATED_ADMIN: NotificationTemplate = {
  type: NotificationType.SALE_CREATED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `New Sale: ${ctx.saleNumber}`,
  smsTemplate: (ctx) => 
    ` New sale ${ctx.saleNumber} at ${ctx.locationName}. ` +
    `Amount: Rs.${ctx.totalAmount}. Customer: ${ctx.customerName || 'Walk-in'}. Items: ${ctx.itemCount}`,
  requiredFields: ['saleNumber', 'locationName', 'totalAmount', 'itemCount']
};

const SALE_COMPLETED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.SALE_COMPLETED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Sale Completed: ${ctx.saleNumber}`,
  smsTemplate: (ctx) => 
    `Thank you ${ctx.customerName}! Your purchase ${ctx.saleNumber} is complete. ` +
    `Total: Rs.${ctx.totalAmount}. Paid: Rs.${ctx.paidAmount}. Visit us again! - ${ctx.companyName}`,
  requiredFields: ['customerName', 'saleNumber', 'totalAmount', 'paidAmount', 'companyName']
};

const SALE_UPDATED_ADMIN: NotificationTemplate = {
  type: NotificationType.SALE_UPDATED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Sale Updated: ${ctx.saleNumber}`,
  smsTemplate: (ctx) => 
    ` Sale ${ctx.saleNumber} modified. ` +
    `Changed by: ${ctx.changedBy}. Location: ${ctx.locationName}. Review required.`,
  requiredFields: ['saleNumber', 'changedBy', 'locationName']
};

const SALE_CANCELLED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.SALE_CANCELLED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Sale Cancelled: ${ctx.saleNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Your sale ${ctx.saleNumber} has been cancelled. ` +
    `Refund of Rs.${ctx.refundAmount} will be processed. Contact: ${ctx.contactPhone} - ${ctx.companyName}`,
  requiredFields: ['customerName', 'saleNumber', 'refundAmount', 'contactPhone', 'companyName']
};

const SALE_CANCELLED_ADMIN: NotificationTemplate = {
  type: NotificationType.SALE_CANCELLED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Sale Cancelled: ${ctx.saleNumber}`,
  smsTemplate: (ctx) => 
    ` Sale ${ctx.saleNumber} cancelled at ${ctx.locationName}. ` +
    `Amount: Rs.${ctx.totalAmount}. Cancelled by: ${ctx.changedBy}. Your  approval needed.`,
  requiredFields: ['saleNumber', 'locationName', 'totalAmount', 'changedBy']
};

const SALE_CANCELLED_MANAGER: NotificationTemplate = {
  type: NotificationType.SALE_CANCELLED,
  recipientType: RecipientType.MANAGER,
  title: (ctx) => `Sale Cancellation Approval: ${ctx.saleNumber}`,
  smsTemplate: (ctx) => 
    ` Sale cancellation requires approval. Sale: ${ctx.saleNumber}. ` +
    `Amount: Rs.${ctx.totalAmount}. Location: ${ctx.locationName}. Please review.`,
  requiredFields: ['saleNumber', 'totalAmount', 'locationName']
};

const SALE_PRICE_CHANGED_ADMIN: NotificationTemplate = {
  type: NotificationType.SALE_PRICE_CHANGED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Sale Price Changed: ${ctx.saleNumber}`,
  smsTemplate: (ctx) => 
    ` Price change in sale ${ctx.saleNumber}. ` +
    `From Rs.${ctx.previousValue} to Rs.${ctx.newValue}. Changed by: ${ctx.changedBy}. Review required.`,
  requiredFields: ['saleNumber', 'previousValue', 'newValue', 'changedBy']
};

const SALE_PAYMENT_RECEIVED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.SALE_PAYMENT_RECEIVED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Payment Received: ${ctx.saleNumber}`,
  smsTemplate: (ctx) => 
    `Thank you ${ctx.customerName}! Payment of Rs.${ctx.paidAmount} received for sale ${ctx.saleNumber}. ` +
    `Balance: Rs.${ctx.balanceAmount}. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'paidAmount', 'saleNumber', 'balanceAmount', 'companyName']
};

const SALE_RECEIPT_CUSTOMER: NotificationTemplate = {
  type: NotificationType.SALE_RECEIPT,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Receipt: ${ctx.saleNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Your receipt for sale ${ctx.saleNumber} is ready. ` +
    `Total: Rs.${ctx.totalAmount}. Items: ${ctx.itemsSummary}. Thank you! - ${ctx.companyName}`,
  requiredFields: ['customerName', 'saleNumber', 'totalAmount', 'itemsSummary', 'companyName']
};

// ===========================================
// PRODUCT RETURN TEMPLATES
// ===========================================

const RETURN_CREATED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.RETURN_CREATED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Return Request Created: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Your return request ${ctx.returnNumber} for ${ctx.productName} has been created. ` +
    `We'll process it soon. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'returnNumber', 'productName', 'companyName']
};

const RETURN_CREATED_ADMIN: NotificationTemplate = {
  type: NotificationType.RETURN_CREATED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `New Return: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    ` New return ${ctx.returnNumber} created. Product: ${ctx.productName}. ` +
    `Customer: ${ctx.customerName}. Reason: ${ctx.returnReason}. Requires inspection.`,
  requiredFields: ['returnNumber', 'productName', 'customerName', 'returnReason']
};

const RETURN_RECEIVED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.RETURN_RECEIVED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Return Received: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, We've received your returned ${ctx.productName} (${ctx.returnNumber}). ` +
    `We'll inspect and process it. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'productName', 'returnNumber', 'companyName']
};

const RETURN_INSPECTED_ADMIN: NotificationTemplate = {
  type: NotificationType.RETURN_INSPECTED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Return Inspected: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    ` Return ${ctx.returnNumber} inspected. Product: ${ctx.productName}. ` +
    `Notes: ${ctx.inspectionNotes}. Your  approval needed.`,
  requiredFields: ['returnNumber', 'productName', 'inspectionNotes']
};

const RETURN_INSPECTED_MANAGER: NotificationTemplate = {
  type: NotificationType.RETURN_INSPECTED,
  recipientType: RecipientType.MANAGER,
  title: (ctx) => `Return Approval Required: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    ` Return ${ctx.returnNumber} requires your approval. ` +
    `Product: ${ctx.productName}. Value: Rs.${ctx.refundAmount}. Location: ${ctx.locationName}`,
  requiredFields: ['returnNumber', 'productName', 'refundAmount', 'locationName']
};

const RETURN_APPROVED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.RETURN_APPROVED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Return Approved: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Your return ${ctx.returnNumber} for ${ctx.productName} has been approved! ` +
    `Refund: Rs.${ctx.refundAmount}. Processing soon. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'returnNumber', 'productName', 'refundAmount', 'companyName']
};

const RETURN_APPROVED_ADMIN: NotificationTemplate = {
  type: NotificationType.RETURN_APPROVED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Return Approved: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    ` Return ${ctx.returnNumber} approved by ${ctx.changedBy}. ` +
    `Product: ${ctx.productName}. Refund: Rs.${ctx.refundAmount}. Process refund now.`,
  requiredFields: ['returnNumber', 'changedBy', 'productName', 'refundAmount']
};

const RETURN_REJECTED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.RETURN_REJECTED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Return Rejected: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Unfortunately, your return ${ctx.returnNumber} for ${ctx.productName} has been rejected. ` +
    `Reason: ${ctx.inspectionNotes}. Contact: ${ctx.contactPhone} - ${ctx.companyName}`,
  requiredFields: ['customerName', 'returnNumber', 'productName', 'inspectionNotes', 'contactPhone', 'companyName']
};

const RETURN_REJECTED_ADMIN: NotificationTemplate = {
  type: NotificationType.RETURN_REJECTED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Return Rejected: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    ` Return ${ctx.returnNumber} rejected by ${ctx.changedBy}. ` +
    `Product: ${ctx.productName}. Customer notified. Close ticket.`,
  requiredFields: ['returnNumber', 'changedBy', 'productName']
};

const RETURN_COMPLETED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.RETURN_COMPLETED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Return Completed: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Your return ${ctx.returnNumber} for ${ctx.productName} has been processed! ` +
    `Cash refund of Rs.${ctx.refundAmount} completed. Thank you! - ${ctx.companyName}`,
  requiredFields: ['customerName', 'returnNumber', 'productName', 'refundAmount', 'companyName']
};

const RETURN_COMPLETED_ADMIN: NotificationTemplate = {
  type: NotificationType.RETURN_COMPLETED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Return Completed: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    ` Return ${ctx.returnNumber} completed by ${ctx.changedBy}. ` +
    `Cash refund Rs.${ctx.refundAmount} paid to customer. Product: ${ctx.productName}.`,
  requiredFields: ['returnNumber', 'changedBy', 'refundAmount', 'productName']
};

const RETURN_REFUNDED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.RETURN_REFUNDED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Refund Processed: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Your refund of Rs.${ctx.refundAmount} for return ${ctx.returnNumber} has been processed. ` +
    `${ctx.paymentMethod}. Thank you! - ${ctx.companyName}`,
  requiredFields: ['customerName', 'refundAmount', 'returnNumber', 'paymentMethod', 'companyName']
};

const RETURN_REPLACED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.RETURN_REPLACED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Product Replaced: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Your ${ctx.productName} has been replaced for return ${ctx.returnNumber}. ` +
    `New item ready for pickup. Contact: ${ctx.contactPhone} - ${ctx.companyName}`,
  requiredFields: ['customerName', 'productName', 'returnNumber', 'contactPhone', 'companyName']
};

const RETURN_UPDATED_ADMIN: NotificationTemplate = {
  type: NotificationType.RETURN_UPDATED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Return Updated: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    ` Return ${ctx.returnNumber} updated. ` +
    `Changed by: ${ctx.changedBy}. Product: ${ctx.productName}. Review required.`,
  requiredFields: ['returnNumber', 'changedBy', 'productName']
};

// ===========================================
// GENERAL TEMPLATES
// ===========================================

const REMINDER_CUSTOMER: NotificationTemplate = {
  type: NotificationType.REMINDER,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Reminder from ${ctx.companyName}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Reminder: ${ctx.actionRequired}. ` +
    `Contact us: ${ctx.contactPhone} - ${ctx.companyName}`,
  requiredFields: ['customerName', 'actionRequired', 'contactPhone', 'companyName']
};

const PROMOTION_CUSTOMER: NotificationTemplate = {
  type: NotificationType.PROMOTION,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Special Offer - ${ctx.companyName}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Special offer for you! ${ctx.actionRequired} ` +
    `Visit ${ctx.locationName}. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'actionRequired', 'locationName', 'companyName']
};

const SALE_HIGH_VALUE_MANAGER: NotificationTemplate = {
  type: NotificationType.SALE_HIGH_VALUE,
  recipientType: RecipientType.MANAGER,
  title: (ctx) => `High Value Sale: ${ctx.saleNumber}`,
  smsTemplate: (ctx) => 
    ` High value sale detected! Sale #${ctx.saleNumber}. ` +
    `Amount: Rs.${ctx.totalAmount}. Customer: ${ctx.customerName || 'Walk-in'}.`,
  requiredFields: ['saleNumber', 'totalAmount']
};

const SALE_HIGH_VALUE_ADMIN: NotificationTemplate = {
  type: NotificationType.SALE_HIGH_VALUE,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `High Value Sale Alert: ${ctx.saleNumber}`,
  smsTemplate: (ctx) => 
    `ALERT: High value sale #${ctx.saleNumber} for Rs.${ctx.totalAmount}. ` +
    `Customer: ${ctx.customerName || 'Walk-in'}. Please review.`,
  requiredFields: ['saleNumber', 'totalAmount']
};

const RETURN_INSPECTED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.RETURN_INSPECTED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Return Inspection: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Your return ${ctx.returnNumber} is now being inspected. ` +
    `Notes: ${ctx.inspectionNotes}. We will update you soon. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'returnNumber', 'companyName']
};

const RETURN_CANCELLED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.RETURN_CANCELLED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Return Cancelled: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Your return ${ctx.returnNumber} has been cancelled. ` +
    `Reason: ${ctx.reason}. Contact us for details. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'returnNumber', 'reason', 'companyName']
};

const RETURN_CANCELLED_ADMIN: NotificationTemplate = {
  type: NotificationType.RETURN_CANCELLED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Return Cancelled: ${ctx.returnNumber}`,
  smsTemplate: (ctx) => 
    ` Return ${ctx.returnNumber} cancelled. ` +
    `Reason: ${ctx.reason}. Customer notified.`,
  requiredFields: ['returnNumber', 'reason']
};

const JOB_DIAGNOSED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.JOB_DIAGNOSED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Job Diagnosed: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Diagnosis complete for Job ${ctx.jobSheetNumber}. ` +
    `Result: ${ctx.diagnosis}. Est. Cost: Rs.${ctx.estimatedCost}. Please approve. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'jobSheetNumber', 'diagnosis', 'estimatedCost', 'companyName']
};

const JOB_REPAIRING_CUSTOMER: NotificationTemplate = {
  type: NotificationType.JOB_REPAIRING,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Repair Started: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Repair started for Job ${ctx.jobSheetNumber} (${ctx.deviceInfo}). ` +
    `Est. Completion: ${ctx.estimatedCompletion}. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'jobSheetNumber', 'deviceInfo', 'companyName']
};

const JOB_REPAIRING_ADMIN: NotificationTemplate = {
  type: NotificationType.JOB_REPAIRING,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Repair Started: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Repair started for Job ${ctx.jobSheetNumber}. Customer: ${ctx.customerName}. ` +
    `Device: ${ctx.deviceInfo}. Est. Completion: ${ctx.estimatedCompletion}.`,
  requiredFields: ['jobSheetNumber', 'customerName', 'deviceInfo', 'estimatedCompletion']
};

const JOB_READY_PICKUP_CUSTOMER: NotificationTemplate = {
  type: NotificationType.JOB_READY_PICKUP,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Ready for Pickup: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Your repair ${ctx.jobSheetNumber} is ready for pickup at ${ctx.pickupLocation}. ` +
    `Est: Rs.${ctx.estimatedCost}, Final: Rs.${ctx.totalAmount}, Paid: Rs.${ctx.paidAmount}, Balance: Rs.${ctx.balanceAmount}. ` +
    `Contact: ${ctx.contactPhone} - ${ctx.companyName}`,
  requiredFields: ['customerName', 'jobSheetNumber', 'pickupLocation', 'estimatedCost', 'totalAmount', 'paidAmount', 'balanceAmount', 'contactPhone', 'companyName']
};

const JOB_READY_PICKUP_ADMIN: NotificationTemplate = {
  type: NotificationType.JOB_READY_PICKUP,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Ready for Pickup: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Job ${ctx.jobSheetNumber} ready for pickup. Customer: ${ctx.customerName}. ` +
    `Est: Rs.${ctx.estimatedCost}, Labour: Rs.${ctx.labourCost}, Parts: Rs.${ctx.partsCost}, ` +
    `Discount: Rs.${ctx.discountAmount}, Total: Rs.${ctx.totalAmount}, Paid: Rs.${ctx.paidAmount}, Balance: Rs.${ctx.balanceAmount}.`,
  requiredFields: ['jobSheetNumber', 'customerName', 'estimatedCost', 'labourCost', 'partsCost', 'discountAmount', 'totalAmount', 'paidAmount', 'balanceAmount']
};

const JOB_DELIVERED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.JOB_DELIVERED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Job Delivered: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Job ${ctx.jobSheetNumber} delivered on ${ctx.deliveryDate}. ` +
    `Total: Rs.${ctx.totalAmount}, Paid: Rs.${ctx.paidAmount}, Balance: Rs.${ctx.balanceAmount}. ` +
    `${ctx.warrantyInfo || 'No warranty'}. Thank you for choosing us! - ${ctx.companyName}`,
  requiredFields: ['customerName', 'jobSheetNumber', 'deliveryDate', 'totalAmount', 'paidAmount', 'balanceAmount', 'companyName']
};

const JOB_DELIVERED_ADMIN: NotificationTemplate = {
  type: NotificationType.JOB_DELIVERED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Job Delivered: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Job ${ctx.jobSheetNumber} delivered to ${ctx.customerName} on ${ctx.deliveryDate}. ` +
    `Total: Rs.${ctx.totalAmount}, Paid: Rs.${ctx.paidAmount}, Balance: Rs.${ctx.balanceAmount}. ` +
    `${ctx.warrantyInfo}.`,
  requiredFields: ['jobSheetNumber', 'customerName', 'deliveryDate', 'totalAmount', 'paidAmount', 'balanceAmount']
};

const JOB_CANCELLED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.JOB_CANCELLED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Job Cancelled: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Job ${ctx.jobSheetNumber} has been cancelled. ` +
    `Reason: ${ctx.reason}. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'jobSheetNumber', 'reason', 'companyName']
};

const JOB_CANCELLED_ADMIN: NotificationTemplate = {
  type: NotificationType.JOB_CANCELLED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `Job Cancelled: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    ` Job ${ctx.jobSheetNumber} cancelled. ` +
    `Reason: ${ctx.reason}. Customer notified.`,
  requiredFields: ['jobSheetNumber', 'reason']
};

const JOB_PRICE_UPDATED_CUSTOMER: NotificationTemplate = {
  type: NotificationType.JOB_PRICE_UPDATED,
  recipientType: RecipientType.CUSTOMER,
  title: (ctx) => `Price Update: ${ctx.jobSheetNumber}`,
  smsTemplate: (ctx) => 
    `Hello ${ctx.customerName}, Price update for Job ${ctx.jobSheetNumber}. ` +
    `Old: Rs.${ctx.oldAmount}, New: Rs.${ctx.newAmount}. Please confirm. - ${ctx.companyName}`,
  requiredFields: ['customerName', 'jobSheetNumber', 'oldAmount', 'newAmount', 'companyName']
};

// ===========================================
// ADDON REQUEST TEMPLATES
// ===========================================

const ADDON_REQUEST_CREATED_ADMIN: NotificationTemplate = {
  type: NotificationType.ADDON_REQUEST_CREATED,
  recipientType: RecipientType.ADMIN,
  title: (ctx) => `New Addon Request: ${ctx.productName}`,
  smsTemplate: (ctx) => 
    `LTS Addon Request: Product: ${ctx.productName} (${ctx.productCode}). ` +
    `Branch: ${ctx.locationName}. Requested By: ${ctx.userName}. ` +
    `Current: ${ctx.currentQuantity}, Need: ${ctx.requestedQuantity}.`,
  requiredFields: ['productName', 'productCode', 'locationName', 'userName', 'currentQuantity', 'requestedQuantity']
};

const ADDON_REQUEST_CREATED_MANAGER: NotificationTemplate = {
  type: NotificationType.ADDON_REQUEST_CREATED,
  recipientType: RecipientType.MANAGER,
  title: (ctx) => `New Addon Request: ${ctx.productName}`,
  smsTemplate: (ctx) => 
    `LTS Addon Request: Product: ${ctx.productName} (${ctx.productCode}). ` +
    `Branch: ${ctx.locationName}. Requested By: ${ctx.userName}. ` +
    `Current: ${ctx.currentQuantity}, Need: ${ctx.requestedQuantity}.`,
  requiredFields: ['productName', 'productCode', 'locationName', 'userName', 'currentQuantity', 'requestedQuantity']
};

const ADDON_REQUEST_APPROVED_STAFF: NotificationTemplate = {
  type: NotificationType.ADDON_REQUEST_APPROVED,
  recipientType: RecipientType.STAFF,
  title: (ctx) => `Addon Request Approved: ${ctx.productName}`,
  smsTemplate: (ctx) => 
    `Good news! Your addon request for ${ctx.productName} has been approved. ` +
    `Quantity: ${ctx.requestedQuantity}. - LTS`,
  requiredFields: ['productName', 'requestedQuantity']
};

const ADDON_REQUEST_REJECTED_STAFF: NotificationTemplate = {
  type: NotificationType.ADDON_REQUEST_REJECTED,
  recipientType: RecipientType.STAFF,
  title: (ctx) => `Addon Request Rejected: ${ctx.productName}`,
  smsTemplate: (ctx) => 
    `Your addon request for ${ctx.productName} has been rejected. ` +
    `${ctx.reason ? `Reason: ${ctx.reason}. ` : ''}Please contact admin. - LTS`,
  requiredFields: ['productName']
};

const ADDON_REQUEST_COMPLETED_STAFF: NotificationTemplate = {
  type: NotificationType.ADDON_REQUEST_COMPLETED,
  recipientType: RecipientType.STAFF,
  title: (ctx) => `Addon Request Completed: ${ctx.productName}`,
  smsTemplate: (ctx) => 
    `Your addon request for ${ctx.productName} has been completed. ` +
    `Quantity: ${ctx.requestedQuantity} added to stock. - LTS`,
  requiredFields: ['productName', 'requestedQuantity']
};

// ===========================================
// TEMPLATE REGISTRY
// ===========================================

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // Job Sheet Templates
  JOB_CREATED_CUSTOMER,
  JOB_CREATED_ADMIN,
  JOB_STARTED_CUSTOMER,
  JOB_COMPLETED_CUSTOMER,
  JOB_COMPLETED_ADMIN,
  JOB_DIAGNOSED_CUSTOMER,
  JOB_REPAIRING_CUSTOMER,
  JOB_REPAIRING_ADMIN,
  JOB_READY_PICKUP_CUSTOMER,
  JOB_READY_PICKUP_ADMIN,
  JOB_DELIVERED_CUSTOMER,
  JOB_DELIVERED_ADMIN,
  JOB_CANCELLED_CUSTOMER,
  JOB_CANCELLED_ADMIN,
  JOB_PRICE_UPDATED_CUSTOMER,
  JOB_UPDATED_ADMIN,
  JOB_STATUS_CHANGED_CUSTOMER,
  JOB_ASSIGNED_TECHNICIAN,
  READY_PICKUP_CUSTOMER,
  PAYMENT_RECEIVED_CUSTOMER,
  PAYMENT_RECEIVED_ADMIN,
  JOB_REMINDER_CUSTOMER,
  
  // Sales Templates
  SALE_CREATED_CUSTOMER,
  SALE_CREATED_ADMIN,
  SALE_HIGH_VALUE_MANAGER,
  SALE_HIGH_VALUE_ADMIN,
  SALE_COMPLETED_CUSTOMER,
  SALE_UPDATED_ADMIN,
  SALE_CANCELLED_CUSTOMER,
  SALE_CANCELLED_ADMIN,
  SALE_CANCELLED_MANAGER,
  SALE_PRICE_CHANGED_ADMIN,
  SALE_PAYMENT_RECEIVED_CUSTOMER,
  SALE_RECEIPT_CUSTOMER,
  
  // Product Return Templates
  RETURN_CREATED_CUSTOMER,
  RETURN_CREATED_ADMIN,
  RETURN_RECEIVED_CUSTOMER,
  RETURN_INSPECTED_ADMIN,
  RETURN_INSPECTED_MANAGER,
  RETURN_INSPECTED_CUSTOMER,
  RETURN_APPROVED_CUSTOMER,
  RETURN_APPROVED_ADMIN,
  RETURN_REJECTED_CUSTOMER,
  RETURN_REJECTED_ADMIN,
  RETURN_COMPLETED_CUSTOMER,
  RETURN_COMPLETED_ADMIN,
  RETURN_REFUNDED_CUSTOMER,
  RETURN_REPLACED_CUSTOMER,
  RETURN_UPDATED_ADMIN,
  RETURN_CANCELLED_CUSTOMER,
  RETURN_CANCELLED_ADMIN,
  
  // General Templates
  REMINDER_CUSTOMER,
  PROMOTION_CUSTOMER,
  
  // Addon Request Templates
  ADDON_REQUEST_CREATED_ADMIN,
  ADDON_REQUEST_CREATED_MANAGER,
  ADDON_REQUEST_APPROVED_STAFF,
  ADDON_REQUEST_REJECTED_STAFF,
  ADDON_REQUEST_COMPLETED_STAFF,
];

/**
 * Get template by type and recipient type
 */
export function getTemplate(
  type: NotificationType,
  recipientType: RecipientType
): NotificationTemplate | undefined {
  return NOTIFICATION_TEMPLATES.find(
    (template) => template.type === type && template.recipientType === recipientType
  );
}

/**
 * Render notification message using template
 */
export function renderNotification(
  type: NotificationType,
  recipientType: RecipientType,
  context: TemplateContext,
  format: 'sms' | 'email' = 'sms'
): { title: string; message: string } {
  const template = getTemplate(type, recipientType);
  
  if (!template) {
    throw new Error(`Template not found for type: ${type}, recipient: ${recipientType}`);
  }
  
  // Validate required fields
  const missingFields = template.requiredFields.filter(
    (field) => context[field] === undefined || context[field] === null
  );
  
  if (missingFields.length > 0) {
    throw new Error(
      `Missing required fields for template ${type}: ${missingFields.join(', ')}`
    );
  }
  
  const title = template.title(context);
  const message = format === 'email' && template.emailTemplate
    ? template.emailTemplate(context)
    : template.smsTemplate(context);
  
  return { title, message };
}

/**
 * Validate template context has required fields
 */
export function validateTemplateContext(
  type: NotificationType,
  recipientType: RecipientType,
  context: TemplateContext
): { valid: boolean; missingFields: string[] } {
  const template = getTemplate(type, recipientType);
  
  if (!template) {
    return { valid: false, missingFields: ['template_not_found'] };
  }
  
  const missingFields = template.requiredFields.filter(
    (field) => context[field] === undefined || context[field] === null
  );
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Get all templates for a notification type
 */
export function getTemplatesForType(type: NotificationType): NotificationTemplate[] {
  return NOTIFICATION_TEMPLATES.filter((template) => template.type === type);
}

/**
 * Get all templates for a recipient type
 */
export function getTemplatesForRecipient(recipientType: RecipientType): NotificationTemplate[] {
  return NOTIFICATION_TEMPLATES.filter((template) => template.recipientType === recipientType);
}

