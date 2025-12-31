import { ReleaseType, ReleaseStatus } from '../../enums';
import {
  CreateStockReleaseDTO,
  UpdateStockReleaseDTO,
  ApproveStockReleaseDTO,
  ReleaseStockDTO,
  ReceiveStockDTO,
  GetStockReleasesQuery,
} from './stockrelease.dto';
import {
  StockRelease,
  StockReleaseItem,
  Product,
  ProductInventory,
  ProductStockMovement,
  Location,
} from '../../models';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database';

class StockReleaseService {

  // Generate unique release number
  private async generateReleaseNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const prefix = `SR-${year}${month}`;

    const lastRelease = await StockRelease.findOne({
      where: {
        releaseNumber: {
          [Op.like]: `${prefix}%`,
        },
      },
      order: [['releaseNumber', 'DESC']],
    });

    if (!lastRelease) {
      return `${prefix}-0001`;
    }

    const releaseData = lastRelease.toJSON();
    const lastNumber = parseInt(releaseData.releaseNumber.split('-')[2]);
    const nextNumber = String(lastNumber + 1).padStart(4, '0');
    return `${prefix}-${nextNumber}`;
  }

  // Create new stock release
  async createStockRelease(data: CreateStockReleaseDTO, userId: string) {
    const releaseNumber = await this.generateReleaseNumber();

    return await sequelize.transaction(async (t) => {
      // Verify all products exist
      const productIds = data.items.map((item) => item.productId);
      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds } },
        transaction: t
      });

      if (products.length !== productIds.length) {
        throw new Error('One or more products not found');
      }

      // Verify fromLocation exists
      const fromLocation = await Location.findByPk(data.fromLocationId, {
        transaction: t
      });

      if (!fromLocation) {
        throw new Error('Source location not found');
      }

      // Verify toLocation if provided
      if (data.toLocationId) {
        const toLocation = await Location.findByPk(data.toLocationId, {
          transaction: t
        });

        if (!toLocation) {
          throw new Error('Destination location not found');
        }
      }

      // Check inventory availability
      for (const item of data.items) {
        const inventory = await ProductInventory.findOne({
          where: {
            locationId: data.fromLocationId,
            productId: item.productId,
          },
          transaction: t
        });

        const invData = inventory?.toJSON();
        if (!inventory || (invData?.quantity || 0) < item.requestedQuantity) {
          const product = products.find((p) => p.id === item.productId);
          const prodData = product?.toJSON();
          throw new Error(
            `Insufficient stock for product ${prodData?.name}. Available: ${invData?.quantity || 0}, Requested: ${item.requestedQuantity}`
          );
        }
      }

      // Create stock release
      const stockRelease = await StockRelease.create({
        releaseNumber,
        releaseType: data.releaseType as ReleaseType,
        releaseDate: new Date(),
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        referenceNumber: data.referenceNumber,
        status: 'PENDING' as ReleaseStatus,
        requestedBy: data.requestedBy || userId,
        notes: data.notes,
      }, {
        transaction: t
      });

      // Create items
      const productsData = products.map(p => p.toJSON());
      await StockReleaseItem.bulkCreate(
        data.items.map((item) => {
          const product = productsData.find((p) => p.id === item.productId);
          const unitCost = Number(product?.costPrice) || 0;
          return {
            stockReleaseId: stockRelease.id,
            productId: item.productId,
            requestedQuantity: item.requestedQuantity,
            releasedQuantity: 0,
            unitCost,
            totalCost: 0,
            batchNumber: item.batchNumber,
            serialNumber: item.serialNumber,
            location: item.location,
            notes: item.notes,
          };
        }),
        { transaction: t }
      );

      await stockRelease.reload({
        include: [
          {
            model: StockReleaseItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product'
              }
            ]
          }
        ],
        transaction: t
      });

      return stockRelease.toJSON();
    });
  }

  // Get all stock releases with filters
  async getAllStockReleases(query: GetStockReleasesQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      releaseType,
      status,
      fromLocationId,
      toLocationId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { releaseNumber: { [Op.iLike]: `%${search}%` } },
        { notes: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (releaseType) {
      where.releaseType = releaseType;
    }

    if (status) {
      where.status = status;
    }

    if (fromLocationId) {
      where.fromLocationId = fromLocationId;
    }

    if (toLocationId) {
      where.toLocationId = toLocationId;
    }

    if (startDate || endDate) {
      where.releaseDate = {};
      if (startDate) {
        where.releaseDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.releaseDate[Op.lte] = new Date(endDate);
      }
    }

    const [stockReleases, total] = await Promise.all([
      StockRelease.findAll({
        where,
        offset: skip,
        limit,
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: [
          {
            model: StockReleaseItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product'
              }
            ]
          }
        ]
      }),
      StockRelease.count({ where }),
    ]);

    return {
      data: stockReleases.map(sr => sr.toJSON()),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get stock release by ID
  async getStockReleaseById(id: string) {
    const stockRelease = await StockRelease.findByPk(id, {
      include: [
        {
          model: StockReleaseItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        }
      ]
    });

    if (!stockRelease) {
      throw new Error('Stock release not found');
    }

    return stockRelease.toJSON();
  }

  // Update stock release (only if PENDING)
  async updateStockRelease(id: string, data: UpdateStockReleaseDTO) {
    const existing = await StockRelease.findByPk(id);

    if (!existing) {
      throw new Error('Stock release not found');
    }

    const existingData = existing.toJSON();
    if (existingData.status !== 'PENDING') {
      throw new Error('Can only update PENDING stock releases');
    }

    return await sequelize.transaction(async (t) => {
      // Update items if provided
      if (data.items) {
        // Delete existing items
        await StockReleaseItem.destroy({
          where: { stockReleaseId: id },
          transaction: t
        });

        // Verify products exist
        const productIds = data.items.map((item) => item.productId);
        const products = await Product.findAll({
          where: { id: { [Op.in]: productIds } },
          transaction: t
        });

        if (products.length !== productIds.length) {
          throw new Error('One or more products not found');
        }

        // Create new items
        const productsData = products.map(p => p.toJSON());
        await StockReleaseItem.bulkCreate(
          data.items.map((item) => {
            const product = productsData.find((p) => p.id === item.productId);
            const unitCost = Number(product?.costPrice) || 0;
            return {
              stockReleaseId: id,
              productId: item.productId,
              requestedQuantity: item.requestedQuantity,
              releasedQuantity: 0,
              unitCost,
              totalCost: 0,
              batchNumber: item.batchNumber,
              serialNumber: item.serialNumber,
              location: item.location,
              notes: item.notes,
            };
          }),
          { transaction: t }
        );
      }

      // Update stock release
      const updateData: any = {};
      if (data.releaseType !== undefined) updateData.releaseType = data.releaseType as ReleaseType;
      if (data.toLocationId !== undefined) updateData.toLocationId = data.toLocationId;
      if (data.notes !== undefined) updateData.notes = data.notes;

      await StockRelease.update(updateData, {
        where: { id },
        transaction: t
      });

      const updated = await StockRelease.findByPk(id, {
        include: [
          {
            model: StockReleaseItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product'
              }
            ]
          }
        ],
        transaction: t
      });

      return updated?.toJSON();
    });
  }

  // Approve stock release
  async approveStockRelease(id: string, data: ApproveStockReleaseDTO, userId: string) {
    const existing = await StockRelease.findByPk(id);

    if (!existing) {
      throw new Error('Stock release not found');
    }

    const existingData = existing.toJSON();
    if (existingData.status !== 'PENDING') {
      throw new Error('Can only approve PENDING stock releases');
    }

    await StockRelease.update({
      status: 'APPROVED' as ReleaseStatus,
      approvedBy: data.approvedBy || userId,
      approvedAt: new Date(),
      notes: data.notes || existingData.notes,
    }, {
      where: { id }
    });

    const updated = await StockRelease.findByPk(id, {
      include: [
        {
          model: StockReleaseItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        }
      ]
    });

    return updated?.toJSON();
  }

  // Release stock (decrement inventory)
  async releaseStock(id: string, data: ReleaseStockDTO, userId: string) {
    const existing = await StockRelease.findByPk(id, {
      include: [
        {
          model: StockReleaseItem,
          as: 'items'
        }
      ]
    });

    if (!existing) {
      throw new Error('Stock release not found');
    }

    const existingData = existing.toJSON();
    if (existingData.status !== 'APPROVED') {
      throw new Error('Can only release APPROVED stock releases');
    }

    return await sequelize.transaction(async (t) => {
      // Determine quantities to release
      const items = (existingData.items || []) as any[];
      const itemsToRelease = data.items
        ? data.items
        : items.map((item) => ({
            itemId: item.id,
            releasedQuantity: item.requestedQuantity,
          }));

      // Process each item
      for (const releaseItem of itemsToRelease) {
        const item = items.find((i) => i.id === releaseItem.itemId);
        if (!item) {
          throw new Error(`Item ${releaseItem.itemId} not found in stock release`);
        }

        // Check inventory
        const inventory = await ProductInventory.findOne({
          where: {
            locationId: existingData.fromLocationId,
            productId: item.productId,
          },
          transaction: t
        });

        const invData = inventory?.toJSON();
        if (!inventory || (invData?.quantity || 0) < releaseItem.releasedQuantity) {
          throw new Error(
            `Insufficient stock for product ${item.productId}. Available: ${invData?.quantity || 0}, Requested: ${releaseItem.releasedQuantity}`
          );
        }

        // Update inventory - decrement
        const currentQty = invData?.quantity || 0;
        const currentAvailQty = invData?.availableQuantity || 0;
        await ProductInventory.update({
          quantity: currentQty - releaseItem.releasedQuantity,
          availableQuantity: currentAvailQty - releaseItem.releasedQuantity,
        }, {
          where: {
            locationId: existingData.fromLocationId,
            productId: item.productId,
          },
          transaction: t
        });

        // Update stock release item
        const totalCost = Number(item.unitCost) * releaseItem.releasedQuantity;
        await StockReleaseItem.update({
          releasedQuantity: releaseItem.releasedQuantity,
          totalCost,
        }, {
          where: { id: item.id },
          transaction: t
        });

        const quantityBefore = currentQty;
        const quantityAfter = quantityBefore - releaseItem.releasedQuantity;

        // Create stock movement record
        await ProductStockMovement.create({
          productId: item.productId,
          locationId: existingData.fromLocationId,
          movementType: 'TRANSFER_OUT',
          quantity: releaseItem.releasedQuantity,
          quantityBefore,
          quantityAfter,
          referenceType: 'STOCK_RELEASE',
          referenceId: existingData.id,
          referenceNumber: existingData.releaseNumber,
          notes: `Stock released: ${existingData.releaseNumber}`,
        }, {
          transaction: t
        });
      }

      // Update stock release status
      await StockRelease.update({
        status: 'RELEASED' as ReleaseStatus,
        releasedBy: userId,
        releasedAt: new Date(),
      }, {
        where: { id },
        transaction: t
      });

      const updated = await StockRelease.findByPk(id, {
        include: [
          {
            model: StockReleaseItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product'
              }
            ]
          }
        ],
        transaction: t
      });

      return updated?.toJSON();
    });
  }

  // Receive stock (increment inventory for branch transfers)
  async receiveStock(id: string, data: ReceiveStockDTO, userId: string) {
    const existing = await StockRelease.findByPk(id, {
      include: [
        {
          model: StockReleaseItem,
          as: 'items'
        }
      ]
    });

    if (!existing) {
      throw new Error('Stock release not found');
    }

    const existingData = existing.toJSON();
    if (existingData.status !== 'RELEASED') {
      throw new Error('Can only receive RELEASED stock');
    }

    if (!existingData.toLocationId) {
      throw new Error('No destination location for this stock release');
    }

    return await sequelize.transaction(async (t) => {
      // Process each item
      const items = (existingData.items || []) as any[];
      for (const item of items) {
        if (item.releasedQuantity === 0) continue;

        // Find or create inventory record
        let inventory = await ProductInventory.findOne({
          where: {
            locationId: existingData.toLocationId,
            productId: item.productId,
          },
          transaction: t
        });

        let quantityBefore: number;
        let quantityAfter: number;

        if (!inventory) {
          inventory = await ProductInventory.create({
            locationId: existingData.toLocationId,
            productId: item.productId,
            quantity: item.releasedQuantity,
            availableQuantity: item.releasedQuantity,
          }, {
            transaction: t
          });
          quantityBefore = 0;
          quantityAfter = item.releasedQuantity;
        } else {
          const invData = inventory.toJSON();
          quantityBefore = invData.quantity || 0;
          quantityAfter = quantityBefore + item.releasedQuantity;
          await ProductInventory.update({
            quantity: quantityAfter,
            availableQuantity: (invData.availableQuantity || 0) + item.releasedQuantity,
          }, {
            where: {
              locationId: existingData.toLocationId,
              productId: item.productId,
            },
            transaction: t
          });
        }

        // Create stock movement record
        await ProductStockMovement.create({
          productId: item.productId,
          locationId: existingData.toLocationId,
          movementType: 'TRANSFER_IN',
          quantity: item.releasedQuantity,
          quantityBefore,
          quantityAfter,
          referenceType: 'STOCK_RELEASE',
          referenceId: existingData.id,
          referenceNumber: existingData.releaseNumber,
          notes: `Stock received from location ${existingData.fromLocationId}: ${existingData.releaseNumber}`,
        }, {
          transaction: t
        });
      }

      // Update stock release status
      await StockRelease.update({
        status: 'COMPLETED' as ReleaseStatus,
        notes: data.notes || existingData.notes,
      }, {
        where: { id },
        transaction: t
      });

      const updated = await StockRelease.findByPk(id, {
        include: [
          {
            model: StockReleaseItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product'
              }
            ]
          }
        ],
        transaction: t
      });

      return updated?.toJSON();
    });
  }

  // Cancel stock release
  async cancelStockRelease(id: string, notes: string) {
    const existing = await StockRelease.findByPk(id);

    if (!existing) {
      throw new Error('Stock release not found');
    }

    const existingData = existing.toJSON();
    if (existingData.status === 'COMPLETED' || existingData.status === 'CANCELLED') {
      throw new Error(`Cannot cancel ${existingData.status} stock release`);
    }

    // If RELEASED, need to restore inventory
    if (existingData.status === 'RELEASED') {
      return await sequelize.transaction(async (t) => {
        const items = await StockReleaseItem.findAll({
          where: { stockReleaseId: id },
          transaction: t
        });

        for (const item of items) {
          const itemData = item.toJSON();
          if (itemData.releasedQuantity > 0) {
            // Get current inventory to calculate before/after
            const currentInventory = await ProductInventory.findOne({
              where: {
                locationId: existingData.fromLocationId,
                productId: itemData.productId,
              },
              transaction: t
            });

            const invData = currentInventory?.toJSON();
            const quantityBefore = invData?.quantity || 0;
            const quantityAfter = quantityBefore + itemData.releasedQuantity;

            // Restore inventory
            await ProductInventory.update({
              quantity: quantityAfter,
              availableQuantity: (invData?.availableQuantity || 0) + itemData.releasedQuantity,
            }, {
              where: {
                locationId: existingData.fromLocationId,
                productId: itemData.productId,
              },
              transaction: t
            });

            // Create reversal movement
            await ProductStockMovement.create({
              productId: itemData.productId,
              locationId: existingData.fromLocationId,
              movementType: 'TRANSFER_IN',
              quantity: itemData.releasedQuantity,
              quantityBefore,
              quantityAfter,
              referenceType: 'STOCK_RELEASE',
              referenceId: existingData.id,
              referenceNumber: existingData.releaseNumber,
              notes: `Stock release cancelled: ${existingData.releaseNumber}`,
            }, {
              transaction: t
            });
          }
        }

        await StockRelease.update({
          status: 'CANCELLED' as ReleaseStatus,
          notes: notes || existingData.notes,
        }, {
          where: { id },
          transaction: t
        });

        const updated = await StockRelease.findByPk(id, {
          include: [
            {
              model: StockReleaseItem,
              as: 'items',
              include: [
                {
                  model: Product,
                  as: 'product'
                }
              ]
            }
          ],
          transaction: t
        });

        return updated?.toJSON();
      });
    }

    // For PENDING/APPROVED, just update status
    await StockRelease.update({
      status: 'CANCELLED' as ReleaseStatus,
      notes: notes || existingData.notes,
    }, {
      where: { id }
    });

    const updated = await StockRelease.findByPk(id, {
      include: [
        {
          model: StockReleaseItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        }
      ]
    });

    return updated?.toJSON();
  }

  // Get stock transfer statistics
  async getStockTransferStats(locationId?: string) {
    const where: any = {};
    if (locationId) {
      where[Op.or] = [{ fromLocationId: locationId }, { toLocationId: locationId }];
    }

    const [
      totalTransfers,
      pendingCount,
      approvedCount,
      inTransitCount,
      completedCount,
      cancelledCount,
    ] = await Promise.all([
      StockRelease.count({ where }),
      StockRelease.count({
        where: { ...where, status: 'PENDING' },
      }),
      StockRelease.count({
        where: { ...where, status: 'APPROVED' },
      }),
      StockRelease.count({
        where: { ...where, status: 'RELEASED' },
      }),
      StockRelease.count({
        where: { ...where, status: 'COMPLETED' },
      }),
      StockRelease.count({
        where: { ...where, status: 'CANCELLED' },
      }),
    ]);

    return {
      totalTransfers,
      pendingApproval: pendingCount,
      approved: approvedCount,
      inTransit: inTransitCount,
      completed: completedCount,
      cancelled: cancelledCount,
    };
  }

  // Delete stock release (only if PENDING or CANCELLED)
  async deleteStockRelease(id: string) {
    const existing = await StockRelease.findByPk(id);

    if (!existing) {
      throw new Error('Stock release not found');
    }

    const existingData = existing.toJSON();
    if (existingData.status !== 'PENDING' && existingData.status !== 'CANCELLED') {
      throw new Error('Can only delete PENDING or CANCELLED stock releases');
    }

    await StockRelease.destroy({
      where: { id }
    });

    return { message: 'Stock release deleted successfully' };
  }
}

export default new StockReleaseService();

