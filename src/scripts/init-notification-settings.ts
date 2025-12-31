/**
 * Initialize/Seed Notification Settings
 * Run this script to create default notification settings for all notification types
 */

import sequelize from '../shared/config/database';
import { NotificationSetting } from '../models';

// Define all notification types with their default settings (old format)
const NOTIFICATION_DEFAULTS = [
  // Sales Notifications
  {
    notificationType: 'SALE_CREATED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'SALE_UPDATED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'MEDIUM' as const,
    autoSend: true,
  },
  {
    notificationType: 'SALE_CANCELLED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'SALE_HIGH_VALUE',
    enabled: true,
    adminEnabled: true,
    managerEnabled: true,
    customerEnabled: false,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'URGENT' as const,
    autoSend: true,
  },
  {
    notificationType: 'SALE_COMPLETED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'MEDIUM' as const,
    autoSend: true,
  },

  // Return Notifications
  {
    notificationType: 'RETURN_CREATED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: true,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'RETURN_INSPECTED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'MEDIUM' as const,
    autoSend: true,
  },
  {
    notificationType: 'RETURN_INSPECTED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'MEDIUM' as const,
    autoSend: true,
  },
  {
    notificationType: 'RETURN_APPROVED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: true,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'RETURN_REJECTED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: true,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'RETURN_REFUNDED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'RETURN_COMPLETED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'RETURN_CANCELLED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },

  // Job Sheet Notifications
  {
    notificationType: 'JOB_CREATED',
    enabled: true,
    adminEnabled: true,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'JOB_STARTED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'MEDIUM' as const,
    autoSend: true,
  },
  {
    notificationType: 'JOB_STATUS_CHANGED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'MEDIUM' as const,
    autoSend: true,
  },
  {
    notificationType: 'JOB_ASSIGNED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: true,
    customerEnabled: false,
    staffEnabled: true,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'JOB_DIAGNOSED',
    enabled: true,
    adminEnabled: true,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'MEDIUM' as const,
    autoSend: true,
  },
  {
    notificationType: 'JOB_REPAIRING',
    enabled: true,
    adminEnabled: false,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'LOW' as const,
    autoSend: true,
  },
  {
    notificationType: 'JOB_COMPLETED',
    enabled: true,
    adminEnabled: true,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'JOB_READY_PICKUP',
    enabled: true,
    adminEnabled: true,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'JOB_DELIVERED',
    enabled: true,
    adminEnabled: true,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'JOB_CANCELLED',
    enabled: true,
    adminEnabled: true,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'JOB_PRICE_UPDATED',
    enabled: true,
    adminEnabled: true,
    managerEnabled: false,
    customerEnabled: true,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },

  // Addon Request Notifications
  {
    notificationType: 'ADDON_REQUEST_CREATED',
    enabled: true,
    adminEnabled: true,
    managerEnabled: true,
    customerEnabled: false,
    staffEnabled: false,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'ADDON_REQUEST_APPROVED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: true,
    customerEnabled: false,
    staffEnabled: true,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'ADDON_REQUEST_REJECTED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: true,
    customerEnabled: false,
    staffEnabled: true,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'HIGH' as const,
    autoSend: true,
  },
  {
    notificationType: 'ADDON_REQUEST_COMPLETED',
    enabled: true,
    adminEnabled: false,
    managerEnabled: true,
    customerEnabled: false,
    staffEnabled: true,
    smsEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    priority: 'MEDIUM' as const,
    autoSend: true,
  },
];

async function initializeNotificationSettings() {
  console.log('🚀 Initializing notification settings...\n');

  // Authenticate connection (models are already registered via database config)
  await sequelize.authenticate();
  console.log('✅ Database connection established\n');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const settings of NOTIFICATION_DEFAULTS) {
    try {
      const existing = await NotificationSetting.findOne({
        where: {
          notificationType: settings.notificationType,
        },
      });

      if (existing) {
        await existing.update(settings);
        console.log(`🔄 ${settings.notificationType} - Updated existing settings`);
        skipped++;
      } else {
        await NotificationSetting.create(settings);
        console.log(`✅ ${settings.notificationType} - Created with defaults`);
        created++;
      }
    } catch (error) {
      console.error(`❌ ${settings.notificationType} - Error:`, error);
      errors++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Created: ${created}`);
  console.log(`⏭️  Skipped (already exist): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📦 Total types: ${NOTIFICATION_DEFAULTS.length}\n`);
}

// Run the initialization
initializeNotificationSettings()
  .then(() => {
    console.log('✅ Notification settings initialization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to initialize notification settings:', error);
    process.exit(1);
  })
  .finally(async () => {
    await sequelize.close();
  });

