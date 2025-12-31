import { AppError } from '../../shared/utils/app-error';
import { 
  CreateGoodsReceiptDto, 
  UpdateGoodsReceiptDto, 
  UpdateGoodsReceiptItemDto,
  QualityCheckDto, 
  ApproveGoodsReceiptDto,
  QueryGoodsReceiptsDto 
} from './goodsreceipt.dto';
import {
  GoodsReceipt,
  GoodsReceiptItem,
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  Product,
  Location,
  ProductInventory,
  ProductStockMovement,
  Warehouse,
} from '../../models';
import { Op, fn, col } from 'sequelize';
import  sequelize  from '../../shared/config/database';

export class GoodsReceiptService {
  // Generate unique GRN number
  async generateGRNNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastGRN = await GoodsReceipt.findOne({
      where: {
        receiptNumber: {
          [Op.like]: `GRN-${year}-%`
        }
      },
      order: [['receiptNumber', 'DESC']],
      attributes: ['receiptNumber'],
    });

    if (!lastGRN || !lastGRN.receiptNumber) {
      return `GRN-${year}-0001`;
    }

    const lastNumber = parseInt(lastGRN.receiptNumber.split('-')[2]);
    const newNumber = lastNumber + 1;
    return `GRN-${year}-${newNumber.toString().padStart(4, '0')}`;
  }

  // Create Goods Receipt
  async createGoodsReceipt(data: CreateGoodsReceiptDto) {
    // Validate purchase order exists
    const po = await PurchaseOrder.findByPk(data.purchaseOrderId, {
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items'
        },
        {
          model: Supplier,
          as: 'supplier'
        }
      ]
    });

    if (!po) {
      throw new AppError(404, 'Purchase order not found');
    }
    if (po.status === "RECEIVED" ){
      throw new AppError(400, 'Purchase order already fully received.');
    }
    if( po.status === "COMPLETED" ){
      throw new AppError(400, 'Purchase order already Payment also Complete completed.');
    }
    if(po.status === "CANCELLED"){
      throw new AppError(400, 'Cannot create goods receipt for a cancelled purchase order');
    }

    // Check for unconfirmed goods receipts if PO is partially received
    if (po.status === 'PARTIALLY_RECEIVED') {
      const unconfirmedGRNs = await GoodsReceipt.findAll({
        where: {
          purchaseOrderId: data.purchaseOrderId,
          status: { [Op.ne]: 'COMPLETED' }
        }
      });
      if (unconfirmedGRNs.length > 0) {
        throw new AppError(400, 'Cannot create goods receipt. Previous goods receipt is not confirmed yet.');
      }
    }

    if (po.status !== 'CONFIRMED' && po.status !== 'SUBMITTED' && po.status !== 'PARTIALLY_RECEIVED') {
      throw new AppError(400, 'Purchase order must be confirmed or submitted before receiving goods');
    }

    // Validate items match PO and check received quantity limits
    for (const item of data.items) {
      const poItem = po.items!.find(i => i.productId === item.productId);
      if (!poItem) {
        throw new AppError(400, `Product ${item.productId} not found in purchase order`);
      }
      if (item.orderedQuantity !== poItem.quantity) {
        throw new AppError(400, `Ordered quantity mismatch for product ${item.productId}`);
      }
      
      // Calculate total quantity that will be received after this goods receipt
      const currentReceivedQty = poItem.receivedQuantity || 0;
      const newTotalReceived = currentReceivedQty + item.receivedQuantity;
      const orderedQty = poItem.quantity;
      
      // Check if total received exceeds ordered quantity
      if (newTotalReceived > orderedQty) {
        const remainingQty = orderedQty - currentReceivedQty;
        const product = await Product.findByPk(item.productId);
        throw new AppError(
          400,
          `Cannot receive ${item.receivedQuantity} units of ${product?.name || item.productId}. ` +
          `Ordered: ${orderedQty}, Already received: ${currentReceivedQty}, ` +
          `Remaining: ${remainingQty}. You can only receive up to ${remainingQty} more units.`
        );
      }
      
      // Validate positive received quantity
      if (item.receivedQuantity <= 0) {
        const product = await Product.findByPk(item.productId);
        throw new AppError(400, `Received quantity must be greater than 0 for product ${product?.name || item.productId}`);
      }
    }

    const grnNumber = await this.generateGRNNumber();

    // Get main warehouse as destination
    const mainWarehouse = await Warehouse.findOne({
      where: { isMainWarehouse: true },
      include: [
        {
          model: Location,
          as: 'location'
        }
      ]
    });

    if (!mainWarehouse) {
      throw new AppError(404, 'Main warehouse not found');
    }

    // Get location for the warehouse
    const location = await Location.findOne({
      where: { warehouseId: mainWarehouse.id }
    });

    if (!location) {
      throw new AppError(404, 'Main warehouse location not found');
    }

    const destinationLocationId = location.id;

    return await sequelize.transaction(async (t) => {
      // Create GRN
      const grn = await GoodsReceipt.create({
        receiptNumber: grnNumber,
        purchaseOrderId: data.purchaseOrderId,
        destinationLocationId,
        receiptDate: data.receiptDate ? new Date(data.receiptDate) : new Date(),
        receivedBy: data.receivedBy,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
        notes: data.notes,
        attachments: data.attachments,
        status: 'PENDING_QC',
      }, { transaction: t });

      await grn.reload({
        include: [
          {
            model: PurchaseOrder,
            as: 'purchaseOrder',
            include: [
              {
                model: Supplier,
                as: 'supplier',
                attributes: ['id', 'name', 'supplier_code']
              }
            ]
          }
        ],
        transaction: t
      });

      // Create GRN items
      const items = await Promise.all(
        data.items.map((item) => {
          const poItem = po.items!.find(i => i.productId === item.productId);
          return GoodsReceiptItem.create({
            goodsReceiptId: grn.id,
            productId: item.productId,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: item.receivedQuantity,
            acceptedQuantity: item.acceptedQuantity,
            rejectedQuantity: item.rejectedQuantity || 0,
            unitPrice: poItem!.unitPrice,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
            qualityStatus: item.qualityStatus || 'PENDING',
            rejectionReason: item.rejectionReason,
            notes: item.notes,
          }, { transaction: t });
        })
      );

      // Check if all PO items are fully received and accepted
      const allItemsFullyReceived = po.items!.every(poItem => {
        const grnItem = data.items.find(item => item.productId === poItem.productId);
        if (!grnItem) return false;
        // All items must be received and accepted with same quantity as ordered
        return grnItem.acceptedQuantity === poItem.quantity;
      });

      // Update PO status based on whether all items are fully received
      await PurchaseOrder.update({
        status: allItemsFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED',
        receivedDate: allItemsFullyReceived ? new Date() : undefined,
      }, {
        where: { id: data.purchaseOrderId },
        transaction: t
      });

      return { ...grn.toJSON(), items: items.map(i => i.toJSON()) };
    });
  }

  // Get all goods receipts with pagination and filters
  async getGoodsReceipts(query: QueryGoodsReceiptsDto) {
    const { page, limit, search, purchaseOrderId, status, startDate, endDate, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { receiptNumber: { [Op.iLike]: `%${search}%` } },
        { invoiceNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (purchaseOrderId) {
      where.purchaseOrderId = purchaseOrderId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.receiptDate = {};
      if (startDate) where.receiptDate[Op.gte] = new Date(startDate);
      if (endDate) where.receiptDate[Op.lte] = new Date(endDate);
    }

    // Handle PO number search
    if (search && !purchaseOrderId) {
      const pos = await PurchaseOrder.findAll({
        where: { poNumber: { [Op.iLike]: `%${search}%` } },
        attributes: ['id']
      });
      if (pos.length > 0) {
        where.purchaseOrderId = { [Op.in]: pos.map(p => p.id) };
      } else if (!where[Op.or]) {
        // If no POs found and no other OR conditions, return empty
        where.id = { [Op.in]: [] };
      }
    }

    const { count, rows: data } = await GoodsReceipt.findAndCountAll({
      where,
      offset,
      limit,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          include: [
            {
              model: Supplier,
              as: 'supplier',
              attributes: ['id', 'name', 'supplier_code']
            }
          ]
        },
        {
          model: GoodsReceiptItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'description']
            }
          ]
        }
      ],
      distinct: true
    });

    return {
      data: data.map(d => d.toJSON()),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Get single goods receipt by ID
  async getGoodsReceiptById(id: string) {
    const grn = await GoodsReceipt.findByPk(id, {
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          include: [
            {
              model: Supplier,
              as: 'supplier',
              attributes: ['id', 'name', 'supplier_code', 'email', 'phone']
            },
            {
              model: PurchaseOrderItem,
              as: 'items',
              include: [
                {
                  model: Product,
                  as: 'product',
                  attributes: ['id', 'name', 'product_code', 'sku']
                }
              ]
            }
          ]
        },
        {
          model: GoodsReceiptItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'description']
            }
          ]
        }
      ]
    });

    if (!grn) {
      throw new AppError(404, 'Goods receipt not found');
    }

    return grn.toJSON();
  }

  // Update goods receipt
  async updateGoodsReceipt(id: string, data: UpdateGoodsReceiptDto) {
    const grn = await GoodsReceipt.findByPk(id);
    if (!grn) {
      throw new AppError(404, 'Goods receipt not found');
    }

    if (grn.status === 'COMPLETED') {
      throw new AppError(400, 'Cannot update completed goods receipt');
    }

    const updateData: any = {};
    if (data.receiptDate !== undefined) updateData.receiptDate = data.receiptDate ? new Date(data.receiptDate) : undefined;
    if (data.receivedBy !== undefined) updateData.receivedBy = data.receivedBy;
    if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber;
    if (data.invoiceDate !== undefined) updateData.invoiceDate = data.invoiceDate ? new Date(data.invoiceDate) : undefined;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;
    if (data.status !== undefined) updateData.status = data.status;

    await GoodsReceipt.update(updateData, {
      where: { id }
    });

    await grn.reload({
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          include: [
            {
              model: Supplier,
              as: 'supplier',
              attributes: ['id', 'name', 'supplier_code']
            }
          ]
        },
        {
          model: GoodsReceiptItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'description']
            }
          ]
        }
      ]
    });

    return grn.toJSON();
  }

  // Update goods receipt item
  async updateGoodsReceiptItem(grnId: string, itemId: string, data: UpdateGoodsReceiptItemDto) {
    const grn = await GoodsReceipt.findByPk(grnId);
    if (!grn) {
      throw new AppError(404, 'Goods receipt not found');
    }

    if (grn.status === 'COMPLETED') {
      throw new AppError(400, 'Cannot update items of completed goods receipt');
    }

    const item = await GoodsReceiptItem.findByPk(itemId);
    if (!item || item.goodsReceiptId !== grnId) {
      throw new AppError(404, 'Goods receipt item not found');
    }

    const updateData: any = {};
    if (data.receivedQuantity !== undefined) updateData.receivedQuantity = data.receivedQuantity;
    if (data.acceptedQuantity !== undefined) updateData.acceptedQuantity = data.acceptedQuantity;
    if (data.rejectedQuantity !== undefined) updateData.rejectedQuantity = data.rejectedQuantity;
    if (data.batchNumber !== undefined) updateData.batchNumber = data.batchNumber;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined;
    if (data.qualityStatus !== undefined) updateData.qualityStatus = data.qualityStatus;
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await GoodsReceiptItem.update(updateData, {
      where: { id: itemId }
    });

    await item.reload();
    return item.toJSON();
  }

  // Perform quality check
  async performQualityCheck(id: string, data: QualityCheckDto) {
    const grn = await GoodsReceipt.findByPk(id, {
      include: [
        {
          model: GoodsReceiptItem,
          as: 'items'
        }
      ]
    });

    if (!grn) {
      throw new AppError(404, 'Goods receipt not found');
    }

    if (grn.status !== 'PENDING_QC') {
      throw new AppError(400, 'Goods receipt is not pending quality check');
    }

    return await sequelize.transaction(async (t) => {
      // Update GRN items
      for (const itemUpdate of data.items) {
        await GoodsReceiptItem.update({
          acceptedQuantity: itemUpdate.acceptedQuantity,
          rejectedQuantity: itemUpdate.rejectedQuantity,
          qualityStatus: itemUpdate.qualityStatus,
          rejectionReason: itemUpdate.rejectionReason,
        }, {
          where: { id: itemUpdate.itemId },
          transaction: t
        });
      }

      // Update GRN status
      await GoodsReceipt.update({
        status: data.status,
        qualityCheckBy: data.qualityCheckBy,
        qualityCheckDate: new Date(),
        qualityCheckNotes: data.qualityCheckNotes,
      }, {
        where: { id },
        transaction: t
      });

      const updatedGRN = await GoodsReceipt.findByPk(id, {
        include: [
          {
            model: PurchaseOrder,
            as: 'purchaseOrder',
            include: [
              {
                model: Supplier,
                as: 'supplier',
                attributes: ['id', 'name', 'supplierCode']
              }
            ]
          },
          {
            model: GoodsReceiptItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'sku', 'description']
              }
            ]
          }
        ],
        transaction: t
      });

      return updatedGRN?.toJSON();
    });
  }

  // Approve goods receipt and update inventory
  async approveGoodsReceipt(id: string, data: ApproveGoodsReceiptDto) {
    const grn = await GoodsReceipt.findByPk(id, {
      include: [
        {
          model: GoodsReceiptItem,
          as: 'items'
        },
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          include: [
            {
              model: PurchaseOrderItem,
              as: 'items'
            }
          ]
        }
      ]
    });

    if (!grn) {
      throw new AppError(404, 'Goods receipt not found');
    }

    if (grn.status === 'COMPLETED') {
      throw new AppError(400, 'Goods receipt already completed');
    }

    // Validate location
    const location = await Location.findByPk(data.locationId);
    if (!location) {
      throw new AppError(404, 'Location not found');
    }

    return await sequelize.transaction(async (t) => {
      // Update inventory for each accepted item
      for (const item of grn.items!) {
        if (item.acceptedQuantity > 0) {
          // Find corresponding PO item for pricing
          const poItem = grn.purchaseOrder.items!.find(i => i.productId === item.productId);
          if (!poItem) continue;

          const unitPrice = Number(poItem.unitPrice || 0);
          const totalValue = item.acceptedQuantity * unitPrice;

          // Upsert inventory
          let inventory = await ProductInventory.findOne({
            where: {
              productId: item.productId,
              locationId: data.locationId
            },
            transaction: t
          });

          const currentQuantity = inventory ? Number(inventory.quantity) : 0;
          const newQuantity = currentQuantity + item.acceptedQuantity;

          if (inventory) {
            // Update existing inventory
            await ProductInventory.update({
              quantity: newQuantity,
              availableQuantity: inventory.availableQuantity + item.acceptedQuantity,
            }, {
              where: {
                productId: item.productId,
                locationId: data.locationId
              },
              transaction: t
            });
          } else {
            // Create new inventory record
            inventory = await ProductInventory.create({
              productId: item.productId,
              locationId: data.locationId,
              quantity: item.acceptedQuantity,
              availableQuantity: item.acceptedQuantity,
              reservedQuantity: 0,
              minStockLevel: 10,
              maxStockLevel: 100,
              averageCost: unitPrice,
              totalValue: totalValue,
              lastRestocked: new Date(),
            }, { transaction: t });
          }

          // Create stock movement record
          await ProductStockMovement.create({
            productId: item.productId,
            locationId: data.locationId,
            movementType: 'PURCHASE',
            quantity: item.acceptedQuantity,
            quantityBefore: currentQuantity,
            quantityAfter: newQuantity,
            notes: `Received from supplier via ${grn.receiptNumber}`,
            referenceType: 'GOODS_RECEIPT',
            referenceId: grn.id,
          }, { transaction: t });
        }
      }

      // Update GRN status
      await GoodsReceipt.update({
        status: 'COMPLETED',
        qualityCheckBy: data.qualityCheckBy,
        qualityCheckDate: new Date(),
        qualityCheckNotes: data.qualityCheckNotes,
      }, {
        where: { id },
        transaction: t
      });

      // Update PO status and received quantities
      const allItemsReceived = grn.purchaseOrder.items!.every(poItem => {
        const receivedQty = grn.items!
          .filter(grnItem => grnItem.productId === poItem.productId)
          .reduce((sum, grnItem) => sum + grnItem.acceptedQuantity, 0);
        return receivedQty >= poItem.quantity;
      });

      await PurchaseOrder.update({
        status: allItemsReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED',
        receivedDate: allItemsReceived ? new Date() : undefined,
      }, {
        where: { id: grn.purchaseOrderId },
        transaction: t
      });

      // Update PO item received quantities
      for (const item of grn.items!) {
        const poItem = grn.purchaseOrder.items!.find(i => i.productId === item.productId);
        if (poItem) {
          const currentReceivedQty = poItem.receivedQuantity || 0;
          await PurchaseOrderItem.update({
            receivedQuantity: currentReceivedQty + item.acceptedQuantity,
          }, {
            where: { id: poItem.id },
            transaction: t
          });
        }
      }

      const updatedGRN = await GoodsReceipt.findByPk(id, {
        include: [
          {
            model: PurchaseOrder,
            as: 'purchaseOrder',
            include: [
              {
                model: Supplier,
                as: 'supplier',
                attributes: ['id', 'name', 'supplier_code']
              }
            ]
          },
          {
            model: GoodsReceiptItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'sku', 'description']
              }
            ]
          }
        ],
        transaction: t
      });

      return updatedGRN?.toJSON();
    });
  }

  // Delete goods receipt
  async deleteGoodsReceipt(id: string) {
    const grn = await GoodsReceipt.findByPk(id);
    if (!grn) {
      throw new AppError(404, 'Goods receipt not found');
    }

    if (grn.status === 'COMPLETED') {
      throw new AppError(400, 'Cannot delete completed goods receipt');
    }

    return await sequelize.transaction(async (t) => {
      // Delete items first
      await GoodsReceiptItem.destroy({
        where: { goodsReceiptId: id },
        transaction: t
      });

      // Delete GRN
      await GoodsReceipt.destroy({
        where: { id },
        transaction: t
      });

      // Update PO status if needed
      await PurchaseOrder.update({
        status: 'CONFIRMED'
      }, {
        where: { id: grn.purchaseOrderId },
        transaction: t
      });

      return { message: 'Goods receipt deleted successfully' };
    });
  }

  // Get goods receipts by purchase order
  async getGoodsReceiptsByPurchaseOrder(purchaseOrderId: string) {
    const receipts = await GoodsReceipt.findAll({
      where: { purchaseOrderId },
      include: [
        {
          model: GoodsReceiptItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'description']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return receipts.map(r => r.toJSON());
  }

  // Get statistics
  async getGoodsReceiptStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [total, pendingQC, completed, todayReceipts] = await Promise.all([
      GoodsReceipt.count(),
      GoodsReceipt.count({ where: { status: 'PENDING_QC' } }),
      GoodsReceipt.count({ where: { status: 'COMPLETED' } }),
      GoodsReceipt.count({
        where: {
          receiptDate: {
            [Op.gte]: todayStart
          }
        }
      }),
    ]);

    return {
      total,
      pendingQC,
      completed,
      todayReceipts,
    };
  }
}

