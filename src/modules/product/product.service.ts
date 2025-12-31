import { AppError } from '../../shared/utils/app-error';
import { withPrismaErrorHandling } from '../../shared/utils/sequelize-error-handler';
import { CreateProductDto, UpdateProductDto, QueryProductsDto, BulkPriceUpdateDto, TransferProductDto, BulkTransferProductDto, AdjustProductStockDto } from './product.dto';
import ExcelJS from 'exceljs';
import {
  Product,
  ProductCategory,
  ProductInventory,
  ProductStockMovement,
  Location,
  SupplierProduct,
  JobSheetProduct,
  PurchaseOrderItem,
  StockReleaseItem,
} from '../../models';
import { Op, fn, col, literal, QueryTypes } from 'sequelize';
import sequelize from '../../shared/config/database';

export class ProductService {
  // Generate unique product code
  async generateProductCode(): Promise<string> {
    const lastProduct = await Product.findOne({
      order: [['productCode', 'DESC']],
      attributes: ['productCode'],
    });

    if (!lastProduct) {
      return 'PRD-0001';
    }

    const lastNumber = parseInt(lastProduct.productCode.split('-')[1]);
    const newNumber = lastNumber + 1;
    return `PRD-${newNumber.toString().padStart(4, '0')}`;
  }

  // Create product
  async createProduct(data: CreateProductDto) {
    const productCode = await this.generateProductCode();

    // Validate category exists
    const category = await ProductCategory.findByPk(data.categoryId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    // Validate price limits (Decimal(10,2) max: 99,999,999.99)
    const MAX_PRICE = 99999999.99;
    if (data.unitPrice && data.unitPrice > MAX_PRICE) {
      throw new AppError(400, `Unit price cannot exceed ${MAX_PRICE.toLocaleString()}`);
    }
    if (data.costPrice && data.costPrice > MAX_PRICE) {
      throw new AppError(400, `Cost price cannot exceed ${MAX_PRICE.toLocaleString()}`);
    }
    if (data.wholesalePrice && data.wholesalePrice > MAX_PRICE) {
      throw new AppError(400, `Wholesale price cannot exceed ${MAX_PRICE.toLocaleString()}`);
    }

    // Check for duplicate SKU or barcode
    if (data.sku) {
      const existingSku = await Product.findOne({ where: { sku: data.sku } });
      if (existingSku) throw new AppError(400, 'SKU already exists');
    }
    if (data.barcode) {
      const existingBarcode = await Product.findOne({ where: { barcode: data.barcode } });
      if (existingBarcode) throw new AppError(400, 'Barcode already exists');
    }

    const product = await Product.create({
      ...data,
      productCode,
    });

    await product.reload({
      include: [
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['id', 'name', 'categoryCode']
        }
      ]
    });

    return product.toJSON();
  }

  // Get all products with pagination
  async getProducts(query: QueryProductsDto) {
    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const offset = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { productCode: { [Op.iLike]: `%${query.search}%` } },
        { sku: { [Op.iLike]: `%${query.search}%` } },
        { barcode: { [Op.iLike]: `%${query.search}%` } },
        { brand: { [Op.iLike]: `%${query.search}%` } },
        { model: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brand) where.brand = { [Op.iLike]: `%${query.brand}%` };
    if (query.qualityGrade) where.qualityGrade = query.qualityGrade;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.isDiscontinued !== undefined) where.isDiscontinued = query.isDiscontinued === 'true';

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      offset,
      limit,
      order: [[query.sortBy, query.sortOrder]],
      include: [
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['id', 'name', 'categoryCode']
        }
      ],
      distinct: true
    });

    // Get counts for each product
    const productsWithCounts = await Promise.all(
      products.map(async (product) => {
        try {
          const [inventoryCount, supplierProductsCount, stockMovementsCount] = await Promise.all([
            ProductInventory.count({ where: { productId: product.id } }),
            SupplierProduct.count({ where: { productId: product.id } }),
            // Count stock movements for this product
            ProductStockMovement.count({ 
              where: { productId: product.id }
            }),
          ]);

          const productJson = product.toJSON();
          
          return {
            ...productJson,
            _count: {
              inventory: inventoryCount,
              supplierProducts: supplierProductsCount,
              stockMovements: stockMovementsCount,
            },
          };
        } catch (error) {
          console.error(`Error processing product ${product.id}:`, error);
          throw error;
        }
      })
    );

    // If lowStock filter is requested, fetch inventory data
    let filteredProducts = productsWithCounts;
    if (query.lowStock === 'true') {
      const productsWithInventory = await Promise.all(
        productsWithCounts.map(async (product) => {
          const inventory = await ProductInventory.findAll({
            where: { productId: product.id },
          });
          const totalQuantity = inventory.reduce((sum, inv) => sum + inv.quantity, 0);
          return { product, totalQuantity };
        })
      );
      filteredProducts = productsWithInventory
        .filter(({ product, totalQuantity }) => totalQuantity <= product.reorderLevel)
        .map(({ product }) => product);
    }

    return {
      data: filteredProducts,
      pagination: {
        total: query.lowStock === 'true' ? filteredProducts.length : count,
        page,
        limit,
        totalPages: Math.ceil((query.lowStock === 'true' ? filteredProducts.length : count) / limit),
      },
    };
  }

  // Get product by ID
  async getProductById(id: string) {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: ProductCategory,
          as: 'category'
        },
        {
          model: ProductInventory,
          as: 'inventory',
          include: [
            {
              model: Location,
              as: 'location',
              attributes: ['id', 'name', 'locationCode']
            }
          ]
        },
        {
          model: SupplierProduct,
          as: 'supplierProducts',
          include: [
            {
              association: 'supplier',
              attributes: ['id', 'name', 'supplierCode', 'phone']
            }
          ]
        }
      ]
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    // Get counts
    const [stockMovementsCount, jobSheetProductsCount] = await Promise.all([
      ProductStockMovement.count({ 
        where: { productId: id }
      }),
      JobSheetProduct.count({ where: { productId: id } }),
    ]);

    // Calculate total inventory
    const inventory = product.inventory || [];
    const totalInventory = inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0);
    const totalReserved = inventory.reduce((sum: number, inv: any) => sum + inv.reservedQuantity, 0);
    const totalAvailable = inventory.reduce((sum: number, inv: any) => sum + inv.availableQuantity, 0);

    return {
      ...product.toJSON(),
      _count: {
        stockMovements: stockMovementsCount,
        jobSheetProducts: jobSheetProductsCount,
      },
      inventorySummary: {
        totalInventory,
        totalReserved,
        totalAvailable,
        isLowStock: totalInventory <= product.reorderLevel,
        isBelowMin: totalInventory < (product.minStockLevel || 0),
      },
    };
  }

  // Update product
  async updateProduct(id: string, data: UpdateProductDto) {
    const product = await Product.findByPk(id);
    if (!product) throw new AppError(404, 'Product not found');

    // Validate category if provided
    if (data.categoryId) {
      const category = await ProductCategory.findByPk(data.categoryId);
      if (!category) throw new AppError(404, 'Category not found');
    }

    // Validate price limits (Decimal(10,2) max: 99,999,999.99)
    const MAX_PRICE = 99999999.99;
    if (data.unitPrice && data.unitPrice > MAX_PRICE) {
      throw new AppError(400, `Unit price cannot exceed ${MAX_PRICE.toLocaleString()}`);
    }
    if (data.costPrice && data.costPrice > MAX_PRICE) {
      throw new AppError(400, `Cost price cannot exceed ${MAX_PRICE.toLocaleString()}`);
    }
    if (data.wholesalePrice && data.wholesalePrice > MAX_PRICE) {
      throw new AppError(400, `Wholesale price cannot exceed ${MAX_PRICE.toLocaleString()}`);
    }

    // Check for duplicate SKU or barcode
    if (data.sku && data.sku !== product.sku) {
      const existingSku = await Product.findOne({ where: { sku: data.sku } });
      if (existingSku) throw new AppError(400, 'SKU already exists');
    }
    if (data.barcode && data.barcode !== product.barcode) {
      const existingBarcode = await Product.findOne({ where: { barcode: data.barcode } });
      if (existingBarcode) throw new AppError(400, 'Barcode already exists');
    }

    // Set discontinued date if marking as discontinued
    const updateData: any = { ...data };
    if (data.isDiscontinued && !product.isDiscontinued) {
      updateData.discontinuedDate = new Date();
    }

    await Product.update(updateData, {
      where: { id }
    });

    await product.reload({
      include: [
        {
          model: ProductCategory,
          as: 'category'
        }
      ]
    });

    return product.toJSON();
  }

  // Delete product
  async deleteProduct(id: string) {
    const product = await Product.findByPk(id);
    if (!product) throw new AppError(404, 'Product not found');

    // Check if product has inventory
    const inventoryCount = await ProductInventory.count({ where: { productId: id } });
    if (inventoryCount > 0) {
      throw new AppError(400, 'Cannot delete product with existing inventory');
    }

    // Check if product has been used in jobs
    const jobSheetProductsCount = await JobSheetProduct.count({ where: { productId: id } });
    if (jobSheetProductsCount > 0) {
      throw new AppError(400, 'Cannot delete product that has been used in job sheets');
    }

    // Check if product has been used in purchase orders
    const purchaseOrderItemsCount = await PurchaseOrderItem.count({ where: { productId: id } });
    if (purchaseOrderItemsCount > 0) {
      throw new AppError(400, 'Cannot delete product that has been used in purchase orders');
    }

    // Check if product has been used in stock releases
    const stockReleasesCount = await StockReleaseItem.count({ where: { productId: id } });
    if (stockReleasesCount > 0) {
      throw new AppError(400, 'Cannot delete product that has been used in stock releases');
    }

    await Product.destroy({ where: { id } });

    return { message: 'Product deleted successfully' };
  }

  // Bulk price update
  async bulkPriceUpdate(data: BulkPriceUpdateDto) {
    const { productIds, priceType, updateType, value } = data;

    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds } },
    });

    const updates = products.map(async (product) => {
      const currentPrice = Number(product[priceType as keyof Product] || 0);
      let newPrice: number;

      if (updateType === 'percentage') {
        newPrice = currentPrice * (1 + value / 100);
      } else {
        newPrice = currentPrice + value;
      }

      return Product.update(
        { [priceType]: newPrice },
        { where: { id: product.id } }
      );
    });

    await Promise.all(updates);

    return { updated: products.length };
  }

  // Get low stock products
  async getLowStockProducts(locationId?: string) {
    const where: any = { isActive: true, isDiscontinued: false };
    const inventoryWhere: any = locationId ? { locationId } : {};

    const products = await Product.findAll({
      where,
      include: [
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['name']
        },
        {
          model: ProductInventory,
          as: 'inventory',
          where: inventoryWhere,
          include: [
            {
              model: Location,
              as: 'location',
              attributes: ['name', 'locationCode']
            }
          ],
          required: false
        }
      ]
    });

    const lowStockProducts = products.filter((product) => {
      const inventory = product.inventory || [];
      const totalStock = inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0);
      return totalStock <= product.reorderLevel;
    });

    return lowStockProducts.map((product) => {
      const inventory = product.inventory || [];
      const totalStock = inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0);
      return {
        ...product.toJSON(),
        totalStock,
        needsReorder: true,
      };
    });
  }

  // Get product statistics
  async getProductStats() {
    const [
      total,
      active,
      discontinued,
      lowStock,
      outOfStock,
      byCategoryQuery,
      byLocationQuery,
    ] = await Promise.all([
      Product.count(),
      Product.count({ where: { isActive: true } }),
      Product.count({ where: { isDiscontinued: true } }),
      this.getLowStockProducts().then((products) => products.length),
      ProductInventory.count({ where: { quantity: 0 } }),
      // Use raw query for groupBy since Sequelize doesn't have direct groupBy
      sequelize.query<{ category_id: string; count: string }>(
        'SELECT "category_id", COUNT(*) as count FROM products GROUP BY "category_id"',
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<{ location_id: string; count: string; total_quantity: string }>(
        `SELECT "location_id", COUNT(*) as count, SUM(quantity) as "total_quantity" 
         FROM product_inventory 
         GROUP BY "location_id"`,
        { type: QueryTypes.SELECT }
      ),
    ]);

    // Get location details and calculate stock value
    const locationStats = await Promise.all(
      byLocationQuery.map(async (locationData) => {
        const location = await Location.findByPk(locationData.location_id, {
          attributes: ['id', 'name', 'locationCode']
        });

        // Calculate total stock value for this location
        const inventoryItems = await ProductInventory.findAll({
          where: { locationId: locationData.location_id },
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['unitPrice']
            }
          ]
        });

        const stockValue = inventoryItems.reduce(
          (sum, item) => sum + item.quantity * Number(item.product?.unitPrice || 0),
          0
        );

        return {
          locationId: locationData.location_id,
          locationName: location?.name || 'Unknown',
          locationCode: location?.locationCode || 'N/A',
          productCount: parseInt(locationData.count) || 0,
          totalQuantity: parseInt(locationData.total_quantity) || 0,
          stockValue: Math.round(stockValue * 100) / 100,
        };
      })
    );

    // Calculate total value across all locations
    const totalValue = locationStats.reduce((sum, location) => sum + location.stockValue, 0);

    return {
      total,
      active,
      inactive: total - active,
      discontinued,
      lowStock,
      outOfStock,
      categoriesCount: byCategoryQuery.length,
      totalValue: Math.round(totalValue * 100) / 100,
      byLocation: locationStats,
    };
  }

  // Transfer product stock between locations
  async transferProduct(data: TransferProductDto) {
    if (data.fromLocationId === data.toLocationId) {
      throw new AppError(400, 'Cannot transfer to the same location');
    }

    // Validate locations
    const [fromLocation, toLocation] = await Promise.all([
      Location.findByPk(data.fromLocationId),
      Location.findByPk(data.toLocationId),
    ]);

    if (!fromLocation) throw new AppError(404, 'Source location not found');
    if (!toLocation) throw new AppError(404, 'Destination location not found');

    // Validate product
    const product = await Product.findByPk(data.productId);
    if (!product) throw new AppError(404, 'Product not found');

    // Check source inventory - find by composite key
    const fromInventory = await ProductInventory.findOne({
      where: {
        productId: data.productId,
        locationId: data.fromLocationId
      }
    });

    if (!fromInventory) {
      throw new AppError(404, 'Source inventory not found');
    }

    if (fromInventory.quantity < data.quantity) {
      throw new AppError(400, `Insufficient stock in source location. Available: ${fromInventory.quantity}, Requested: ${data.quantity}`);
    }

    // Check or create destination inventory
    const toInventory = await ProductInventory.findOne({
      where: {
        productId: data.productId,
        locationId: data.toLocationId
      }
    });

    return await sequelize.transaction(async (t) => {
      // Update source inventory
      const newFromQuantity = fromInventory.quantity - data.quantity;
      const newFromAvailableQuantity = newFromQuantity - fromInventory.reservedQuantity;
      await ProductInventory.update({
        quantity: newFromQuantity,
        availableQuantity: newFromAvailableQuantity,
        lastRestocked: new Date(),
      }, {
        where: {
          productId: data.productId,
          locationId: data.fromLocationId
        },
        transaction: t
      });

      // Update or create destination inventory
      let newToQuantity = data.quantity;
      if (toInventory) {
        newToQuantity = toInventory.quantity + data.quantity;
        const newToAvailableQuantity = newToQuantity - toInventory.reservedQuantity;
        await ProductInventory.update({
          quantity: newToQuantity,
          availableQuantity: newToAvailableQuantity,
          lastRestocked: new Date(),
        }, {
          where: {
            productId: data.productId,
            locationId: data.toLocationId
          },
          transaction: t
        });
      } else {
        await ProductInventory.create({
          productId: data.productId,
          locationId: data.toLocationId,
          quantity: data.quantity,
          availableQuantity: data.quantity,
          storageLocation: 'Main Storage',
          lastRestocked: new Date(),
        }, { transaction: t });
      }

      // Create stock movement records
      const oldFromQuantity = fromInventory.quantity;
      await ProductStockMovement.create({
        productId: data.productId,
        locationId: data.fromLocationId,
        movementType: 'TRANSFER_OUT',
        quantity: data.quantity,
        quantityBefore: oldFromQuantity,
        quantityAfter: newFromQuantity,
        notes: `Transfer to ${toLocation.name} (${toLocation.locationCode}): ${data.notes || ''}`,
        referenceType: 'STOCK_TRANSFER',
      }, { transaction: t });

      // Get or create destination inventory ID
      const destInventory = toInventory || await ProductInventory.findOne({
        where: { productId: data.productId, locationId: data.toLocationId },
        transaction: t
      });
      
      if (destInventory) {
        const oldToQuantity = toInventory?.quantity || 0;
        await ProductStockMovement.create({
          productId: data.productId,
          locationId: data.toLocationId,
          movementType: 'TRANSFER_IN',
          quantity: data.quantity,
          quantityBefore: oldToQuantity,
          quantityAfter: newToQuantity,
          notes: `Transfer from ${fromLocation.name} (${fromLocation.locationCode}): ${data.notes || ''}`,
          referenceType: 'STOCK_TRANSFER',
        }, { transaction: t });
      }

      return {
        message: 'Product transferred successfully',
        transfer: {
          product: { id: product.id, name: product.name, productCode: product.productCode },
          from: { id: fromLocation.id, name: fromLocation.name, code: fromLocation.locationCode },
          to: { id: toLocation.id, name: toLocation.name, code: toLocation.locationCode },
          quantity: data.quantity,
        }
      };
    });
  }

  // Bulk transfer multiple products
  async bulkTransferProducts(data: BulkTransferProductDto) {
    if (data.fromLocationId === data.toLocationId) {
      throw new AppError(400, 'Cannot transfer to the same location');
    }

    // Validate locations
    const [fromLocation, toLocation] = await Promise.all([
      Location.findByPk(data.fromLocationId),
      Location.findByPk(data.toLocationId),
    ]);

    if (!fromLocation) throw new AppError(404, 'Source location not found');
    if (!toLocation) throw new AppError(404, 'Destination location not found');

    // Validate all products and check inventory
    const productIds = data.items.map(item => item.productId);
    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new AppError(404, 'Some products not found');
    }

    // Check all source inventories
    const inventoryChecks = await Promise.all(
      data.items.map(async (item) => {
        const inventory = await ProductInventory.findOne({
          where: {
            productId: item.productId,
            locationId: data.fromLocationId
          },
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['name', 'productCode']
            }
          ]
        });

        if (!inventory) {
          throw new AppError(404, `Product ${item.productId} not found in source location`);
        }

        if (inventory.quantity < item.quantity) {
          throw new AppError(
            400,
            `Insufficient stock for ${inventory.product?.name} (${inventory.product?.productCode}). Available: ${inventory.quantity}, Requested: ${item.quantity}`
          );
        }

        return { item, inventory };
      })
    );

    return await sequelize.transaction(async (t) => {
      const results = [];

      for (const { item, inventory } of inventoryChecks) {
        // Update source inventory
        const newFromQuantity = inventory.quantity - item.quantity;
        const newFromAvailableQuantity = newFromQuantity - inventory.reservedQuantity;
        await ProductInventory.update({
          quantity: newFromQuantity,
          availableQuantity: newFromAvailableQuantity,
          lastRestocked: new Date(),
        }, {
          where: {
            productId: item.productId,
            locationId: data.fromLocationId
          },
          transaction: t
        });

        // Check destination inventory
        const toInventory = await ProductInventory.findOne({
          where: {
            productId: item.productId,
            locationId: data.toLocationId
          },
          transaction: t
        });

        // Update or create destination inventory
        let newToQuantity = item.quantity;
        if (toInventory) {
          newToQuantity = toInventory.quantity + item.quantity;
          const newToAvailableQuantity = newToQuantity - toInventory.reservedQuantity;
          await ProductInventory.update({
            quantity: newToQuantity,
            availableQuantity: newToAvailableQuantity,
            lastRestocked: new Date(),
          }, {
            where: {
              productId: item.productId,
              locationId: data.toLocationId
            },
            transaction: t
          });
        } else {
          await ProductInventory.create({
            productId: item.productId,
            locationId: data.toLocationId,
            quantity: item.quantity,
            reservedQuantity: 0,
            availableQuantity: item.quantity,
            storageLocation: 'Main Storage',
            averageCost: 0,
            totalValue: 0,
            lastRestocked: new Date(),
          }, { transaction: t });
        }

        // Create stock movement records
        const oldFromQty = inventory.quantity;
        const newFromQty = inventory.quantity - item.quantity;
        await ProductStockMovement.create({
          productId: item.productId,
          locationId: data.fromLocationId,
          movementType: 'TRANSFER_OUT',
          quantity: item.quantity,
          quantityBefore: oldFromQty,
          quantityAfter: newFromQty,
          notes: `Bulk transfer to ${toLocation.name} (${toLocation.locationCode}): ${data.notes || ''}`,
          referenceType: 'STOCK_TRANSFER',
        }, { transaction: t });

        // Get destination inventory for movement tracking
        const destInv = toInventory || await ProductInventory.findOne({
          where: { productId: item.productId, locationId: data.toLocationId },
          transaction: t
        });
        
        if (destInv) {
          const oldToQty = toInventory?.quantity || 0;
          await ProductStockMovement.create({
            productId: item.productId,
            locationId: data.toLocationId,
            movementType: 'TRANSFER_IN',
            quantity: item.quantity,
            quantityBefore: oldToQty,
            quantityAfter: newToQuantity,
            notes: `Bulk transfer from ${fromLocation.name} (${fromLocation.locationCode}): ${data.notes || ''}`,
            referenceType: 'STOCK_TRANSFER',
          }, { transaction: t });
        }

        results.push({
          productId: item.productId,
          productName: inventory.product?.name || '',
          productCode: inventory.product?.productCode || '',
          quantity: item.quantity,
          status: 'success',
        });
      }

      return {
        message: `Successfully transferred ${results.length} product(s)`,
        from: { id: fromLocation.id, name: fromLocation.name, code: fromLocation.locationCode },
        to: { id: toLocation.id, name: toLocation.name, code: toLocation.locationCode },
        items: results,
      };
    });
  }

  // Adjust product stock (add/remove/adjust)
  async adjustProductStock(data: AdjustProductStockDto) {
    // Validate product and location
    const [product, location] = await Promise.all([
      Product.findByPk(data.productId),
      Location.findByPk(data.locationId),
    ]);

    if (!product) throw new AppError(404, 'Product not found');
    if (!location) throw new AppError(404, 'Location not found');

    // Get or create inventory record
    let inventory = await ProductInventory.findOne({
      where: {
        productId: data.productId,
        locationId: data.locationId
      }
    });

    return await sequelize.transaction(async (t) => {
      const currentQuantity = inventory?.quantity || 0;
      let newQuantity: number;

      if (!inventory) {
        // Create new inventory if it doesn't exist
        newQuantity = data.quantity > 0 ? data.quantity : 0;
        inventory = await ProductInventory.create({
          productId: data.productId,
          locationId: data.locationId,
          quantity: newQuantity,
          availableQuantity: newQuantity,
          storageLocation: 'Main Storage',
          lastRestocked: new Date(),
        }, { transaction: t });
      } else {
        // Update existing inventory
        newQuantity = inventory.quantity + data.quantity;

        if (newQuantity < 0) {
          throw new AppError(400, `Cannot reduce stock below zero. Current: ${inventory.quantity}, Adjustment: ${data.quantity}`);
        }

        const newAvailableQuantity = newQuantity - inventory.reservedQuantity;
        await ProductInventory.update({
          quantity: newQuantity,
          availableQuantity: newAvailableQuantity,
        }, {
          where: {
            productId: data.productId,
            locationId: data.locationId
          },
          transaction: t
        });
      }

      // Map movement type to valid enum
      let mappedMovementType: string = data.quantity > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
      if (data.movementType === 'STOCK_IN' || data.movementType === 'PURCHASE') {
        mappedMovementType = 'PURCHASE';
      } else if (data.movementType === 'STOCK_OUT' || data.movementType === 'SALE') {
        mappedMovementType = 'SALES';
      } else if (data.movementType === 'RETURN') {
        mappedMovementType = 'RETURN_FROM_CUSTOMER';
      } else if (data.movementType === 'DAMAGE') {
        mappedMovementType = 'DAMAGED';
      } else if (data.movementType === 'FOUND') {
        mappedMovementType = 'FOUND';
      } else if (data.movementType === 'LOST') {
        mappedMovementType = 'STOLEN';
      }

      // Create stock movement record
      await ProductStockMovement.create({
        productId: data.productId,
        locationId: data.locationId,
        movementType: mappedMovementType as any,
        quantity: Math.abs(data.quantity),
        quantityBefore: currentQuantity,
        quantityAfter: newQuantity,
        notes: data.notes || `${data.movementType} adjustment`,
        referenceType: data.referenceType || 'ADJUSTMENT',
        referenceId: data.referenceId,
      }, { transaction: t });

      return {
        message: 'Stock adjusted successfully',
        product: { id: product.id, name: product.name, productCode: product.productCode },
        location: { id: location.id, name: location.name, code: location.locationCode },
        adjustment: data.quantity,
        newQuantity: inventory ? inventory.quantity + data.quantity : data.quantity,
      };
    });
  }

  // Get product stock movements
  async getProductStockMovements(productId?: string, locationId?: string, limit: number = 100) {
    const include: any[] = [
      {
        model: Product,
        as: 'product',
        required: true,
        attributes: ['id', 'productCode', 'name', 'brand', 'model']
      }
    ];

    // Build where conditions
    const where: any = {};
    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;

    return await ProductStockMovement.findAll({
      where: Object.keys(where).length > 0 ? where : undefined,
      order: [['createdAt', 'DESC']],
      limit,
      include
    });
  }

  // Bulk upload products from CSV or Excel file
  async bulkUploadProducts(file: Express.Multer.File) {
    const fileName = file.originalname.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') ||
      file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel');

    let rows: any[] = [];

    if (isExcel) {
      // Parse Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer as any);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new AppError(400, 'Invalid Excel file: No data found');
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const cells = row.values as any[];
          rows.push({
            sku: cells[1]?.toString().trim() || undefined,
            barcode: cells[2]?.toString().trim() || undefined,
            name: cells[3]?.toString().trim(),
            description: cells[4]?.toString().trim() || undefined,
            categoryName: cells[5]?.toString().trim(),
            brand: cells[6]?.toString().trim() || undefined,
            model: cells[7]?.toString().trim() || undefined,
            unitPrice: parseFloat(cells[8]?.toString()) || 0,
            costPrice: parseFloat(cells[9]?.toString()) || 0,
            wholesalePrice: cells[10] ? parseFloat(cells[10]?.toString()) : undefined,
            minStockLevel: parseInt(cells[11]?.toString()) || 5,
            maxStockLevel: parseInt(cells[12]?.toString()) || 100,
            reorderLevel: parseInt(cells[13]?.toString()) || 10,
            reorderQuantity: parseInt(cells[14]?.toString()) || 20,
            warrantyMonths: parseInt(cells[15]?.toString()) || 0,
            isActive: cells[16]?.toString().toLowerCase() === 'true' || cells[16]?.toString() === '1',
          });
        }
      });
    } else {
      // Parse CSV file
      const csvContent = file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new AppError(400, 'Invalid CSV file: No data found or missing header');
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        if (cells.length < 5) continue;

        rows.push({
          sku: cells[0]?.trim() || undefined,
          barcode: cells[1]?.trim() || undefined,
          name: cells[2]?.trim(),
          description: cells[3]?.trim() || undefined,
          categoryName: cells[4]?.trim(),
          brand: cells[5]?.trim() || undefined,
          model: cells[6]?.trim() || undefined,
          unitPrice: parseFloat(cells[7]?.trim()) || 0,
          costPrice: parseFloat(cells[8]?.trim()) || 0,
          wholesalePrice: cells[9] ? parseFloat(cells[9]?.trim()) : undefined,
          minStockLevel: parseInt(cells[10]?.trim()) || 5,
          maxStockLevel: parseInt(cells[11]?.trim()) || 100,
          reorderLevel: parseInt(cells[12]?.trim()) || 10,
          reorderQuantity: parseInt(cells[13]?.trim()) || 20,
          warrantyMonths: parseInt(cells[14]?.trim()) || 0,
          isActive: cells[15]?.toString().toLowerCase() === 'true' || cells[15]?.toString() === '1',
        });
      }
    }

    if (rows.length === 0) {
      throw new AppError(400, 'No valid data found in file');
    }

    // Validate data and create/update products
    const errors = [];
    const productsCreated = [];
    const productsUpdated = [];

    console.log(`Processing ${rows.length} rows from file`);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      console.log(`Processing row ${i + 1}: ${row.name}`);

      if (!row.name || !row.categoryName || row.unitPrice <= 0 || row.costPrice <= 0) {
        errors.push(`Row ${i + 2}: Name, category name, unit price, and cost price are required`);
        continue;
      }

      // Find category by name
      const category = await ProductCategory.findOne({
        where: { name: row.categoryName }
      });
      if (!category) {
        errors.push(`Row ${i + 2}: Category "${row.categoryName}" not found`);
        continue;
      }

      // Check if product already exists (by name or SKU)
      let existingProduct = null;
      if (row.sku) {
        existingProduct = await Product.findOne({
          where: { sku: row.sku }
        });
      }
      if (!existingProduct) {
        existingProduct = await Product.findOne({
          where: { name: row.name }
        });
      }

      const productData = {
        sku: row.sku,
        barcode: row.barcode,
        name: row.name,
        description: row.description,
        categoryId: category.id,
        brand: row.brand,
        model: row.model,
        unitPrice: row.unitPrice,
        costPrice: row.costPrice,
        wholesalePrice: row.wholesalePrice,
        minStockLevel: row.minStockLevel,
        maxStockLevel: row.maxStockLevel,
        reorderLevel: row.reorderLevel,
        reorderQuantity: row.reorderQuantity,
        warrantyMonths: row.warrantyMonths,
        isActive: row.isActive,
      };

      if (existingProduct) {
        console.log(`Product "${row.name}" already exists, updating`);
        await Product.update(productData, {
          where: { id: existingProduct.id }
        });
        productsUpdated.push(row.name);
      } else {
        console.log(`Creating new product "${row.name}"`);
        const productCode = await this.generateProductCode();
        await Product.create({
          ...productData,
          productCode,
        });
        productsCreated.push(row.name);
      }
    }

    return {
      success: true,
      message: `Bulk upload completed. Created: ${productsCreated.length}, Updated: ${productsUpdated.length}, Errors: ${errors.length}`,
      data: {
        created: productsCreated.length,
        updated: productsUpdated.length,
        errors: errors.length,
        errorDetails: errors,
      },
    };
  }
}

