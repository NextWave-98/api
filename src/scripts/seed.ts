import sequelize from '../shared/config/database';
import { Permission } from '../models/permission.model';
import { Role } from '../models/role.model';
import { User } from '../models/user.model';
import { Location } from '../models/location.model';
import { Warehouse } from '../models/warehouse.model';
import { initializeAssociations, getAllModels } from '../models';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // Models are already registered via getAllModels() in shared database config
  console.log('✅ Models registered with Sequelize');

  await sequelize.authenticate();
  console.log('✅ Database connected successfully.');

  initializeAssociations();

  // Create or Update Permissions (using upsert to avoid duplicates)
  const permissionResults = await Promise.all([
    // User Management
    Permission.upsert({
      name: 'users.create',
      description: 'Create users',
      module: 'users',
      action: 'create',
    }),
    Permission.upsert({
      name: 'users.read',
      description: 'View users',
      module: 'users',
      action: 'read',
    }),
    Permission.upsert({
      name: 'users.update',
      description: 'Update users',
      module: 'users',
      action: 'update',
    }),
    Permission.upsert({
      name: 'users.delete',
      description: 'Delete users',
      module: 'users',
      action: 'delete',
    }),
    // Role Management
    Permission.upsert({
      name: 'roles.manage',
      description: 'Manage roles',
      module: 'roles',
      action: 'manage',
    }),
    // Dashboard
    Permission.upsert({
      name: 'dashboard.admin',
      description: 'Access admin dashboard',
      module: 'dashboard',
      action: 'read',
    }),
    Permission.upsert({
      name: 'dashboard.staff',
      description: 'Access staff dashboard',
      module: 'dashboard',
      action: 'read',
    }),
    // Customer Management
    Permission.upsert({
      name: 'customers.create',
      description: 'Create customers',
      module: 'customers',
      action: 'create',
    }),
    Permission.upsert({
      name: 'customers.read',
      description: 'View customers',
      module: 'customers',
      action: 'read',
    }),
    Permission.upsert({
      name: 'customers.update',
      description: 'Update customers',
      module: 'customers',
      action: 'update',
    }),

    Permission.upsert({
      name: 'customers.delete',
      description: 'Delete customers',
      module: 'customers',
      action: 'delete',
    }),
    // Location Management (Warehouses and Branches)
    Permission.upsert({
      name: 'locations.create',
      description: 'Create locations (warehouses/branches)',
      module: 'locations',
      action: 'create',
    }),
    Permission.upsert({
      name: 'locations.read',
      description: 'View locations',
      module: 'locations',
      action: 'read',
    }),
    Permission.upsert({
      name: 'locations.update',
      description: 'Update locations',
      module: 'locations',
      action: 'update',
    }),
    Permission.upsert({
      name: 'locations.delete',
      description: 'Delete locations',
      module: 'locations',
      action: 'delete',
    }),
    Permission.upsert({
      name: 'locations.manage',
      description: 'Manage location assignments',
      module: 'locations',
      action: 'manage',
    }),
    // Device Management
    Permission.upsert({
      name: 'devices.create',
      description: 'Create devices',
      module: 'devices',
      action: 'create',
    }),
    Permission.upsert({
      name: 'devices.read',
      description: 'View devices',
      module: 'devices',
      action: 'read',
    }),
    Permission.upsert({
      name: 'devices.update',
      description: 'Update devices',
      module: 'devices',
      action: 'update',
    }),
    Permission.upsert({
      name: 'devices.delete',
      description: 'Delete devices',
      module: 'devices',
      action: 'delete',
    }),
    // Inventory Management
    Permission.upsert({
      name: 'inventory.create',
      description: 'Create inventory records',
      module: 'inventory',
      action: 'create',
    }),
    Permission.upsert({
      name: 'inventory.read',
      description: 'View inventory',
      module: 'inventory',
      action: 'read',
    }),
    Permission.upsert({
      name: 'inventory.update',
      description: 'Update inventory',
      module: 'inventory',
      action: 'update',
    }),
    Permission.upsert({
      name: 'inventory.delete',
      description: 'Delete inventory',
      module: 'inventory',
      action: 'delete',
    }),
    Permission.upsert({
      name: 'inventory.adjust',
      description: 'Adjust inventory stock',
      module: 'inventory',
      action: 'adjust',
    }),
    Permission.upsert({
      name: 'inventory.transfer',
      description: 'Transfer stock between locations',
      module: 'inventory',
      action: 'transfer',
    }),
    Permission.upsert({
      name: 'inventory.approve',
      description: 'Approve inventory transfers',
      module: 'inventory',
      action: 'approve',
    }),
    // Stock Management
    Permission.upsert({
      name: 'stock.read',
      description: 'View stock releases and transfers',
      module: 'stock',
      action: 'read',
    }),
    Permission.upsert({
      name: 'stock.write',
      description: 'Create and update stock releases',
      module: 'stock',
      action: 'write',
    }),
    Permission.upsert({
      name: 'stock.delete',
      description: 'Delete stock releases',
      module: 'stock',
      action: 'delete',
    }),
    Permission.upsert({
      name: 'stock.approve',
      description: 'Approve stock releases',
      module: 'stock',
      action: 'approve',
    }),
    // JobSheet Management
    Permission.upsert({
      name: 'jobsheets.create',
      description: 'Create job sheets',
      module: 'jobsheets',
      action: 'create',
    }),
    Permission.upsert({
      name: 'jobsheets.read',
      description: 'View job sheets',
      module: 'jobsheets',
      action: 'read',
    }),
    Permission.upsert({
      name: 'jobsheets.update',
      description: 'Update job sheets',
      module: 'jobsheets',
      action: 'update',
    }),
    Permission.upsert({
      name: 'jobsheets.delete',
      description: 'Delete job sheets',
      module: 'jobsheets',
      action: 'delete',
    }),
    Permission.upsert({
      name: 'jobsheets.manage',
      description: 'Manage job sheet status and parts',
      module: 'jobsheets',
      action: 'manage',
    }),
    // Parts Management
    Permission.upsert({
      name: 'parts.create',
      description: 'Create parts',
      module: 'parts',
      action: 'create',
    }),
    Permission.upsert({
      name: 'parts.read',
      description: 'View parts',
      module: 'parts',
      action: 'read',
    }),
    Permission.upsert({
      name: 'parts.update',
      description: 'Update parts',
      module: 'parts',
      action: 'update',
    }),
    Permission.upsert({
      name: 'parts.delete',
      description: 'Delete parts',
      module: 'parts',
      action: 'delete',
    }),
    // Payment Management
    Permission.upsert({
      name: 'payments.create',
      description: 'Create payments',
      module: 'payments',
      action: 'create',
    }),
    Permission.upsert({
      name: 'payments.read',
      description: 'View payments',
      module: 'payments',
      action: 'read',
    }),
    Permission.upsert({
      name: 'payments.update',
      description: 'Update payments',
      module: 'payments',
      action: 'update',
    }),
    Permission.upsert({
      name: 'payments.delete',
      description: 'Delete payments',
      module: 'payments',
      action: 'delete',
    }),
    // Supplier Payment Management
    Permission.upsert({
      name: 'supplier-payments.create',
      description: 'Create supplier payments',
      module: 'supplier-payments',
      action: 'create',
    }),
    Permission.upsert({
      name: 'supplier-payments.read',
      description: 'View supplier payments',
      module: 'supplier-payments',
      action: 'read',
    }),
    Permission.upsert({
      name: 'supplier-payments.update',
      description: 'Update supplier payments',
      module: 'supplier-payments',
      action: 'update',
    }),
    Permission.upsert({
      name: 'supplier-payments.delete',
      description: 'Delete supplier payments',
      module: 'supplier-payments',
      action: 'delete',
    }),
    // Product Management
    Permission.upsert({
      name: 'products.create',
      description: 'Create products',
      module: 'products',
      action: 'create',
    }),
    Permission.upsert({
      name: 'products.transfer',
      description: 'Transfer products',
      module: 'products',
      action: 'transfer',
    }),
    Permission.upsert({
      name: 'products.read',
      description: 'View products',
      module: 'products',
      action: 'read',
    }),
    Permission.upsert({
      name: 'products.update',
      description: 'Update products',
      module: 'products',
      action: 'update',
    }),
    Permission.upsert({
      name: 'products.delete',
      description: 'Delete products',
      module: 'products',
      action: 'delete',
    }),
    // Product Category Management
    Permission.upsert({
      name: 'productcategories.create',
      description: 'Create product categories',
      module: 'productcategories',
      action: 'create',
    }),
    Permission.upsert({
      name: 'productcategories.read',
      description: 'View product categories',
      module: 'productcategories',
      action: 'read',
    }),
    Permission.upsert({
      name: 'productcategories.update',
      description: 'Update product categories',
      module: 'productcategories',
      action: 'update',
    }),
    Permission.upsert({
      name: 'productcategories.delete',
      description: 'Delete product categories',
      module: 'productcategories',
      action: 'delete',
    }),
    // Purchase Order Management
    Permission.upsert({
      name: 'purchaseorders.create',
      description: 'Create purchase orders',
      module: 'purchaseorders',
      action: 'create',
    }),
    Permission.upsert({
      name: 'purchaseorders.read',
      description: 'View purchase orders',
      module: 'purchaseorders',
      action: 'read',
    }),
    Permission.upsert({
      name: 'purchaseorders.update',
      description: 'Update purchase orders',
      module: 'purchaseorders',
      action: 'update',
    }),
    Permission.upsert({
      name: 'purchaseorders.delete',
      description: 'Delete purchase orders',
      module: 'purchaseorders',
      action: 'delete',
    }),
    Permission.upsert({
      name: 'purchaseorders.approve',
      description: 'Approve purchase orders',
      module: 'purchaseorders',
      action: 'approve',
    }),
    // Supplier Management
    Permission.upsert({
      name: 'suppliers.create',
      description: 'Create suppliers',
      module: 'suppliers',
      action: 'create',
    }),
    Permission.upsert({
      name: 'suppliers.read',
      description: 'View suppliers',
      module: 'suppliers',
      action: 'read',
    }),
    Permission.upsert({
      name: 'suppliers.update',
      description: 'Update suppliers',
      module: 'suppliers',
      action: 'update',
    }),
    Permission.upsert({
      name: 'suppliers.delete',
      description: 'Delete suppliers',
      module: 'suppliers',
      action: 'delete',
    }),
    // Sales Dashboard
    Permission.upsert({
      name: 'view_sales',
      description: 'View sales dashboard and analytics',
      module: 'sales',
      action: 'read',
    }),
    // Warranty Management
    Permission.upsert({
      name: 'warranty.read',
      description: 'View warranty cards and claims',
      module: 'warranty',
      action: 'read',
    }),
    Permission.upsert({
      name: 'warranty.create',
      description: 'Create warranty cards',
      module: 'warranty',
      action: 'create',
    }),
    Permission.upsert({
      name: 'warranty.update',
      description: 'Update warranty cards',
      module: 'warranty',
      action: 'update',
    }),
    Permission.upsert({
      name: 'warranty.void',
      description: 'Void warranty cards',
      module: 'warranty',
      action: 'void',
    }),
    Permission.upsert({
      name: 'warranty.resolve',
      description: 'Resolve warranty claims',
      module: 'warranty',
      action: 'resolve',
    }),
    Permission.upsert({
      name: 'warranty.assign',
      description: 'Assign warranty claims',
      module: 'warranty',
      action: 'assign',
    }),
    // Reporting Permissions
    Permission.upsert({
      name: 'read:reports',
      description: 'Read reports',
      module: 'reports',
      action: 'read',
    }),
    Permission.upsert({
      name: 'download:reports',
      description: 'Download reports',
      module: 'reports',
      action: 'download',
    }),
    // SMS Management
    Permission.upsert({
      name: 'manage.sms',
      description: 'Manage SMS operations (send, balance check)',
      module: 'sms',
      action: 'manage',
    }),
    Permission.upsert({
      name: 'view.sms.logs',
      description: 'View SMS logs and statistics',
      module: 'sms',
      action: 'view',
    }),
  ]);

  // Extract permission instances from upsert results
  const permissions = permissionResults.map(([p, _]) => p);

  console.log('✅ Permissions created');

  // Create or Update Admin Role
  const [adminRole] = await Role.upsert({
    name: 'ADMIN',
    description: 'Administrator with full access',
  });
  await (adminRole as any).setPermissions(permissions);

  // Create or Update Manager Role
  const [managerRole] = await Role.upsert({
    name: 'MANAGER',
    description: 'Location Managers (Warehouse & Branch)',
  });
  const managerPermissions = permissions.filter(p => !p.name.endsWith('.delete'));
  await (managerRole as any).setPermissions(managerPermissions);

  console.log('✅ Roles created');

  // ============================================
  // CREATE WAREHOUSE WITH LOCATION
  // ============================================
  
  // Check if warehouse location exists
  let mainWarehouseLocation = await Location.findOne({ where: { locationCode: 'WH-0001' } });

  let warehouse = await Warehouse.findOne({ where: { warehouseCode: 'WH-0001' } });

  try {
    if (!mainWarehouseLocation || !warehouse) {
      // Create warehouse and location in transaction
      const result = await sequelize.transaction(async (tx) => {
        // Create or update Location
        const [location] = await Location.upsert({
          locationCode: 'WH-0001',
          name: 'Main Warehouse',
          locationType: 'WAREHOUSE',
          address: '100 Warehouse District, Industrial Zone',
          city: 'Colombo',
          phone: '+94112345678',
          email: 'warehouse@lts.com',
        }, { transaction: tx });

        // Create or update Warehouse
        const [wh] = await Warehouse.upsert({
          warehouseCode: 'WH-0001',
          name: 'Main Warehouse',
          address: '100 Warehouse District, Industrial Zone',
          city: 'Colombo',
          phone: '+94112345678',
          email: 'warehouse@lts.com',
          storageCapacity: 5000,
          totalArea: 10000,
          isMainWarehouse: true,
          warehouseType: 'GENERAL',
          hasSecuritySystem: true,
          hasLoadingDock: true,
          operatingHours: 'Mon-Sat: 8AM-6PM',
        }, { transaction: tx });

        // Link Location to Warehouse
        await Location.update({ warehouseId: wh.id }, { where: { id: location.id }, transaction: tx });

        return { location, warehouse: wh };
      });

      mainWarehouseLocation = result.location;
      warehouse = result.warehouse;
    }
    console.log('✅ Warehouse created');
  } catch (error) {
    console.error('Error creating warehouse:', error);
  }

  // Create Admin User
  const hashedPassword = await bcrypt.hash('Ma12345%', 12);

  // Admin user (no location assignment - has access to all locations)
  try {
    await User.upsert({
      email: 'admin@123.com',
      name: 'Admin User',
      password: hashedPassword,
      roleId: adminRole.id,
      locationId: null,
    });
    console.log('✅ Admin user created');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }

  console.log('\n📝 Login Credentials:');
  console.log('Admin: admin@123.com / Ma12345%');
  console.log('Warehouse:');
  console.log('Main Warehouse (WH-0001)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await sequelize.close();
  });

