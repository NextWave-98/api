import { AppError } from '../../shared/utils/app-error';
import { withPrismaErrorHandling } from '../../shared/utils/sequelize-error-handler';
import {
  CreateInventoryDTO,
  UpdateInventoryDTO,
  AdjustStockDTO,
  TransferStockDTO,
} from './inventory.dto';
import {
  ProductInventory,
  ProductStockMovement,
  Product,
  ProductCategory,
  Location,
} from '../../models';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database';

export class InventoryService {
  async createInventory(data: CreateInventoryDTO) {
    const existingInventory = await ProductInventory.findOne({
      where: {
        productId: data.productId,
        locationId: data.locationId,
      },
    });

    if (existingInventory) {
      throw new AppError(400, 'Inventory for this product and location already exists');
    }

    const inventory = await ProductInventory.create({
      productId: data.productId,
      locationId: data.locationId,
      quantity: data.quantity,
      availableQuantity: data.quantity,
      minStockLevel: data.minStockLevel,
      maxStockLevel: data.maxStockLevel,
      lastRestocked: new Date(),
    });

    await inventory.reload({
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: ProductCategory,
              as: 'category',
              attributes: ['id', 'name', 'categoryCode']
            }
          ],
          attributes: ['id', 'productCode', 'sku', 'name', 'brand', 'model', 'unitPrice']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode', 'address']
        }
      ]
    });

    await ProductStockMovement.create({
      productId: data.productId,
      locationId: data.locationId,
      movementType: 'PURCHASE',
      quantity: data.quantity,
      quantityBefore: 0,
      quantityAfter: data.quantity,
      referenceType: 'PURCHASE_ORDER',
      notes: 'Initial inventory setup',
    });

    return inventory.toJSON();
  }

  async getInventory(locationId?: string, productId?: string, page = 1, limit = 10, search?: string, sortBy?: string, sortOrder?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (locationId) where.locationId = locationId;
    if (productId) where.productId = productId;

    // Note: Search and location filter need to be handled via includes
    const include: any[] = [
      {
        model: Product,
        as: 'product',
        where: search ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { productCode: { [Op.iLike]: `%${search}%` } },
            { sku: { [Op.iLike]: `%${search}%` } },
            { barcode: { [Op.iLike]: `%${search}%` } },
          ]
        } : undefined,
        required: !!search,
        include: [
          {
            model: ProductCategory,
            as: 'category',
            attributes: ['id', 'name', 'category_code']
          }
        ],
        attributes: ['id', 'productCode', 'sku', 'barcode', 'name', 'brand', 'model', 'unitPrice', 'costPrice', 'minStockLevel', 'reorderLevel', 'primaryImage', 'warrantyMonths', 'isActive']
      },
      {
        model: Location,
        as: 'location',
        where: { locationType: 'BRANCH' },
        required: true,
        attributes: ['id', 'name', 'locationCode', 'address']
      }
    ];

    // Determine orderBy
    // Note: product_inventory table doesn't have updatedAt, only createdAt
    let order: any[] = [['createdAt', 'DESC']];
    if (sortBy) {
      const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';
      if (sortBy === 'name') {
        order = [[{ model: Product, as: 'product' }, 'name', orderDir]];
      } else if (sortBy === 'quantity') {
        order = [['quantity', orderDir]];
      } else if (sortBy === 'createdAt') {
        order = [['createdAt', orderDir]];
      }
    }

    const [inventory, total] = await Promise.all([
      ProductInventory.findAll({
        where,
        offset: skip,
        limit,
        order,
        include
      }),
      ProductInventory.count({ where }),
    ]);

    // Calculate totalValue and averageCost for each inventory item
    const inventoryWithStats = inventory.map((item) => {
      const itemData = item.toJSON();
      const product = itemData.product as any;
      return {
        ...itemData,
        averageCost: product?.costPrice ? Number(product.costPrice) : 0,
        totalValue: product?.costPrice 
          ? Number(product.costPrice) * itemData.quantity 
          : 0,
      };
    });

    return {
      inventory: inventoryWithStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInventoryById(id: string) {
    const inventory = await ProductInventory.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: ProductCategory,
              as: 'category',
              attributes: ['id', 'name', 'categoryCode']
            }
          ]
        },
        {
          model: Location,
          as: 'location'
        }
      ]
    });

    if (!inventory) {
      throw new AppError(404, 'Inventory not found');
    }

    return inventory.toJSON();
  }

  async updateInventory(id: string, data: UpdateInventoryDTO) {
    const inventory = await ProductInventory.findByPk(id);

    if (!inventory) {
      throw new AppError(404, 'Inventory not found');
    }

    await ProductInventory.update({
      minStockLevel: data.minStockLevel,
      maxStockLevel: data.maxStockLevel,
      storageLocation: data.location,
      zone: data.zone,
    }, {
      where: { id }
    });

    const updated = await ProductInventory.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: ProductCategory,
              as: 'category',
              attributes: ['id', 'name', 'categoryCode']
            }
          ]
        },
        {
          model: Location,
          as: 'location'
        }
      ]
    });

    return updated?.toJSON();
  }

  async adjustStock(inventoryId: string, data: AdjustStockDTO) {
    const inventory = await ProductInventory.findByPk(inventoryId);

    if (!inventory) {
      throw new AppError(404, 'Inventory not found');
    }

    const inventoryData = inventory.toJSON();
    let newQuantity = inventoryData.quantity;
    const quantityBefore = inventoryData.quantity;

    // Map old movement types to new ProductStockMovement types
    let movementType: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'DAMAGED' | 'RETURN_FROM_CUSTOMER' = 'ADJUSTMENT_IN';
    
    if (data.movementType === 'IN' || data.movementType === 'RETURN') {
      newQuantity += data.quantity;
      movementType = data.movementType === 'RETURN' ? 'RETURN_FROM_CUSTOMER' : 'ADJUSTMENT_IN';
    } else if (data.movementType === 'OUT' || data.movementType === 'DAMAGED') {
      if (inventoryData.quantity < Math.abs(data.quantity)) {
        throw new AppError(400, 'Insufficient stock');
      }
      newQuantity -= Math.abs(data.quantity);
      movementType = data.movementType === 'DAMAGED' ? 'DAMAGED' : 'ADJUSTMENT_OUT';
    } else if (data.movementType === 'ADJUSTMENT') {
      newQuantity = data.quantity;
      movementType = newQuantity > quantityBefore ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
    }

    await ProductInventory.update({
      quantity: newQuantity,
      availableQuantity: newQuantity - (inventoryData.reservedQuantity || 0),
      lastRestocked: data.movementType === 'IN' ? new Date() : inventoryData.lastRestocked,
    }, {
      where: { id: inventoryId }
    });

    await ProductStockMovement.create({
      productId: inventoryData.productId,
      locationId: inventoryData.locationId,
      movementType: movementType,
      quantity: Math.abs(newQuantity - quantityBefore),
      quantityBefore: quantityBefore,
      quantityAfter: newQuantity,
      referenceType: 'PURCHASE_ORDER',
      notes: data.notes,
    });

    const updated = await ProductInventory.findByPk(inventoryId, {
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: ProductCategory,
              as: 'category',
              attributes: ['id', 'name', 'categoryCode']
            }
          ]
        },
        {
          model: Location,
          as: 'location'
        }
      ]
    });

    return updated?.toJSON();
  }

  async transferStock(data: TransferStockDTO) {
    if (data.fromLocationId === data.toLocationId) {
      throw new AppError(400, 'Cannot transfer to the same location');
    }

    const fromInventory = await ProductInventory.findOne({
      where: {
        productId: data.productId,
        locationId: data.fromLocationId,
      },
    });

    if (!fromInventory) {
      throw new AppError(404, 'Source inventory not found');
    }

    const fromData = fromInventory.toJSON();
    if (fromData.quantity < data.quantity) {
      throw new AppError(400, 'Insufficient stock in source location');
    }

    const toInventory = await ProductInventory.findOne({
      where: {
        productId: data.productId,
        locationId: data.toLocationId,
      },
    });

    await sequelize.transaction(async (t) => {
      const fromQtyBefore = fromData.quantity;
      const fromQtyAfter = fromData.quantity - data.quantity;

      await ProductInventory.update({
        quantity: fromQtyAfter,
        availableQuantity: fromQtyAfter - (fromData.reservedQuantity || 0),
      }, {
        where: { id: fromData.id },
        transaction: t
      });

      if (toInventory) {
        const toData = toInventory.toJSON();
        const toQtyBefore = toData.quantity;
        const toQtyAfter = toData.quantity + data.quantity;

        await ProductInventory.update({
          quantity: toQtyAfter,
          availableQuantity: toQtyAfter - (toData.reservedQuantity || 0),
        }, {
          where: { id: toData.id },
          transaction: t
        });
      } else {
        await ProductInventory.create({
          productId: data.productId,
          locationId: data.toLocationId,
          quantity: data.quantity,
          availableQuantity: data.quantity,
        }, {
          transaction: t
        });
      }

      await ProductStockMovement.create({
        productId: data.productId,
        locationId: data.fromLocationId,
        movementType: 'TRANSFER_OUT',
        quantity: data.quantity,
        quantityBefore: fromQtyBefore,
        quantityAfter: fromQtyAfter,
        referenceType: 'TRANSFER',
        notes: `Transfer to ${data.toLocationId}: ${data.notes || ''}`,
      }, {
        transaction: t
      });

      const toData = toInventory?.toJSON();
      await ProductStockMovement.create({
        productId: data.productId,
        locationId: data.toLocationId,
        movementType: 'TRANSFER_IN',
        quantity: data.quantity,
        quantityBefore: toData?.quantity || 0,
        quantityAfter: (toData?.quantity || 0) + data.quantity,
        referenceType: 'TRANSFER',
        notes: `Transfer to location ${data.toLocationId}: ${data.notes || ''}`,
      }, {
        transaction: t
      });
    });

    return { message: 'Stock transferred successfully' };
  }

  async getLowStockItems(locationId?: string) {
    const where: any = {};
    if (locationId) where.locationId = locationId;

    const inventory = await ProductInventory.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: ProductCategory,
              as: 'category',
              attributes: ['id', 'name', 'categoryCode']
            }
          ]
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode', 'address']
        }
      ]
    });

    const lowStock = inventory.filter((item) => {
      const itemData = item.toJSON();
      const product = itemData.product as any;
      const minStock = itemData.minStockLevel ?? product?.minStockLevel;
      return itemData.quantity <= minStock;
    });

    return lowStock.map(i => i.toJSON());
  }

  async getStockMovements(productId?: string, locationId?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;

    const movements = await ProductStockMovement.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 100,
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: ProductCategory,
              as: 'category',
              attributes: ['id', 'name', 'categoryCode']
            }
          ],
          attributes: ['id', 'productCode', 'sku', 'name', 'brand', 'model']
        }
      ]
    });

    return movements.map(m => m.toJSON());
  }

  async getLocationInventory(locationId: string) {
    const location = await Location.findByPk(locationId, {
      attributes: ['id', 'name', 'locationCode', 'locationType', 'address']
    });

    if (!location) {
      throw new AppError(404, 'Location not found');
    }

    // Query ProductInventory for products (not Inventory which is for parts)
    const productInventory = await ProductInventory.findAll({
      where: { locationId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: ProductCategory,
              as: 'category',
              attributes: ['id', 'name', 'categoryCode']
            }
          ],
          attributes: ['id', 'productCode', 'sku', 'barcode', 'name', 'brand', 'model', 'unitPrice', 'costPrice', 'minStockLevel', 'reorderLevel', 'primaryImage', 'warrantyMonths', 'isActive']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode']
        }
      ]
    });

    const inventoryData = productInventory.map(i => i.toJSON());
    return {
      location: location.toJSON(),
      totalProducts: inventoryData.length,
      totalQuantity: inventoryData.reduce((sum, item) => sum + item.quantity, 0),
      totalAvailableQuantity: inventoryData.reduce((sum, item) => sum + item.availableQuantity, 0),
      totalReservedQuantity: inventoryData.reduce((sum, item) => sum + (item.reservedQuantity || 0), 0),
      // Compute total value from product unit price * quantity when totalValue not maintained
      totalValue: inventoryData.reduce((sum, item) => {
        const product = item.product as any;
        const unitPrice = product?.unitPrice ? Number(product.unitPrice) : 0;
        return sum + unitPrice * (item.quantity || 0);
      }, 0),
      products: inventoryData.map((item) => {
        const product = item.product as any;
        const minStock = item.minStockLevel ?? product?.minStockLevel;
        const reorderLevel = item.maxStockLevel ?? product?.reorderLevel;
        
        return {
          id: item.id,
          productId: product.id,
          productCode: product.productCode,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          brand: product.brand,
          model: product.model,
          category: product.category,
          unitPrice: product.unitPrice,
          costPrice: product.costPrice,
          primaryImage: product.primaryImage,
          warrantyMonths: product.warrantyMonths,
          quantity: item.quantity,
          availableQuantity: item.availableQuantity,
          reservedQuantity: item.reservedQuantity,
          location: item.location,
          minStockLevel: minStock,
          reorderLevel: reorderLevel,
          isLowStock: item.quantity <= minStock,
          needsReorder: item.quantity <= reorderLevel,
          totalValue: (() => {
            const unitPrice = product?.unitPrice ? Number(product.unitPrice) : 0;
            return unitPrice * (item.quantity || 0);
          })(),
          lastStockCheck: item.lastStockCheck,
          createdAt: item.createdAt,
          isActive: product.isActive,
        };
      }),
    };
  }

  async getDashboardStatsStore(locationId?: string) {
    const where: any = {};
    if (locationId) {
      where.locationId = locationId;
    }

    // Note: Location filter needs to be handled via include
    // Get all inventory items with products
    const inventoryItems = await ProductInventory.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: ProductCategory,
              as: 'category',
              attributes: ['id', 'name', 'categoryCode']
            }
          ]
        },
        {
          model: Location,
          as: 'location',
          where: { locationType: 'WAREHOUSE' },
          required: true,
          attributes: ['id', 'name', 'locationCode']
        }
      ]
    });

    // Calculate statistics
    const totalItems = inventoryItems.length;
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    // Compute total value using product unit price * quantity (fallback to totalValue if present)
    const totalValue = inventoryItems.reduce((sum, item) => {
      const unitPrice = item.product?.unitPrice ? Number(item.product.unitPrice) : 0;
      const lineValue = unitPrice * (item.quantity || 0);
      return sum + lineValue;
    }, 0);
    
    // Count items with stock (quantity > 0)
    const inStockItems = inventoryItems.filter(item => item.quantity > 0).length;
    
    // Low stock items (quantity <= minStockLevel)
    const lowStockItems = inventoryItems.filter(item => {
      const minStock = item.minStockLevel ?? item.product.minStockLevel;
      return item.quantity > 0 && item.quantity <= minStock;
    }).length;
    
    // Out of stock items (quantity = 0)
    const outOfStockItems = inventoryItems.filter(item => item.quantity === 0).length;
    
    // Overstocked items (quantity >= maxStockLevel)
    const overstockedItems = inventoryItems.filter(item => {
      const maxStock = item.maxStockLevel ?? item.product.reorderLevel * 2;
      return maxStock && item.quantity >= maxStock;
    }).length;
    
    // Get unique locations count
    const uniqueLocations = new Set(inventoryItems.map(item => item.locationId));
    const totalLocations = uniqueLocations.size;
    
    // Category breakdown
    const categoryMap: Record<string, number> = {};
    inventoryItems.forEach(item => {
      const categoryName = item.product.category.name;
      categoryMap[categoryName] = (categoryMap[categoryName] || 0) + 1;
    });
    
    const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }));
    
    // Get products with stock grouped by location
    let productsByLocation = [];
    if (locationId) {
      // If location filter applied, get products for that location only
      productsByLocation = inventoryItems
        .filter(item => item.quantity > 0)
        .map(item => {
          const unitPrice = item.product?.unitPrice ? Number(item.product.unitPrice) : 0;
          const lineValue = unitPrice * (item.quantity || 0);

          return {
            id: item.id,
            productId: item.product.id,
            productCode: item.product.productCode,
            sku: item.product.sku,
            name: item.product.name,
            brand: item.product.brand,
            model: item.product.model,
            category: item.product.category,
            quantity: item.quantity,
            availableQuantity: item.availableQuantity,
            unitPrice: item.product.unitPrice,
            totalValue: lineValue,
            locationId: item.locationId,
            location: item.location,
          };
        });
    } else {
      // Get all products with stock
      productsByLocation = inventoryItems
        .filter(item => item.quantity > 0)
        .map(item => {
          const unitPrice = item.product?.unitPrice ? Number(item.product.unitPrice) : 0;
          const lineValue = unitPrice * (item.quantity || 0);
          
          return {
            id: item.id,
            productId: item.product.id,
            productCode: item.product.productCode,
            sku: item.product.sku,
            name: item.product.name,
            brand: item.product.brand,
            model: item.product.model,
            category: item.product.category,
            quantity: item.quantity,
            availableQuantity: item.availableQuantity,
            unitPrice: item.product.unitPrice,
            totalValue: lineValue,
            locationId: item.locationId,
            location: item.location,
          };
        });
    }

    return {
      stats: {
        totalItems,
        totalQuantity,
        totalValue,
        inStockItems,
        lowStockItems,
        outOfStockItems,
        overstockedItems,
        totalLocations,
        categoryBreakdown,
      },
      productsWithStock: productsByLocation,
    };
  }
  async getDashboardStats(locationId?: string) {
    const where: any = {};
    if (locationId) {
      where.locationId = locationId;
    }

    // Get all inventory items with products
    const inventoryItems = await ProductInventory.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: ProductCategory,
              as: 'category',
              attributes: ['id', 'name', 'categoryCode']
            }
          ]
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'locationCode']
        }
      ]
    });

    // Calculate statistics
    const itemsData = inventoryItems.map(i => i.toJSON());
    const totalItems = itemsData.length;
    const totalQuantity = itemsData.reduce((sum, item) => sum + item.quantity, 0);
    // Compute total value using product unit price * quantity (fallback to totalValue if present)
    const totalValue = itemsData.reduce((sum, item) => {
      const product = item.product as any;
      const unitPrice = product?.unitPrice ? Number(product.unitPrice) : 0;
      const lineValue = unitPrice * (item.quantity || 0);
      return sum + lineValue;
    }, 0);
    
    // Count items with stock (quantity > 0)
    const inStockItems = itemsData.filter(item => item.quantity > 0).length;
    
    // Low stock items (quantity <= minStockLevel)
    const lowStockItems = itemsData.filter(item => {
      const product = item.product as any;
      const minStock = item.minStockLevel ?? product?.minStockLevel;
      return item.quantity > 0 && item.quantity <= minStock;
    }).length;
    
    // Out of stock items (quantity = 0)
    const outOfStockItems = itemsData.filter(item => item.quantity === 0).length;
    
    // Overstocked items (quantity >= maxStockLevel)
    const overstockedItems = itemsData.filter(item => {
      const product = item.product as any;
      const maxStock = item.maxStockLevel ?? product?.reorderLevel * 2;
      return maxStock && item.quantity >= maxStock;
    }).length;
    
    // Get unique locations count
    const uniqueLocations = new Set(itemsData.map(item => item.locationId));
    const totalLocations = uniqueLocations.size;
    
    // Category breakdown
    const categoryMap: Record<string, number> = {};
    itemsData.forEach(item => {
      const product = item.product as any;
      const categoryName = product?.category?.name;
      if (categoryName) {
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + 1;
      }
    });
    
    const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }));
    
    // Get products with stock grouped by location
    let productsByLocation = [];
    if (locationId) {
      // If location filter applied, get products for that location only
      productsByLocation = itemsData
        .filter(item => item.quantity > 0)
        .map(item => {
          const product = item.product as any;
          const unitPrice = product?.unitPrice ? Number(product.unitPrice) : 0;
          const lineValue = unitPrice * (item.quantity || 0);

          return {
            id: item.id,
            productId: product.id,
            productCode: product.productCode,
            sku: product.sku,
            name: product.name,
            brand: product.brand,
            model: product.model,
            category: product.category,
            quantity: item.quantity,
            availableQuantity: item.availableQuantity,
            unitPrice: product.unitPrice,
            totalValue: lineValue,
            locationId: item.locationId,
            location: item.location,
          };
        });
    } else {
      // Get all products with stock
      productsByLocation = itemsData
        .filter(item => item.quantity > 0)
        .map(item => {
          const product = item.product as any;
          return {
            id: item.id,
            productId: product.id,
            productCode: product.productCode,
            sku: product.sku,
            name: product.name,
            brand: product.brand,
            model: product.model,
            category: product.category,
            quantity: item.quantity,
            availableQuantity: item.availableQuantity,
            unitPrice: product.unitPrice,
            totalValue: item.totalValue,
            locationId: item.locationId,
            location: item.location,
          };
        });
    }

    return {
      stats: {
        totalItems,
        totalQuantity,
        totalValue,
        inStockItems,
        lowStockItems,
        outOfStockItems,
        overstockedItems,
        totalLocations,
        categoryBreakdown,
      },
      productsWithStock: productsByLocation,
    };
  }
}

