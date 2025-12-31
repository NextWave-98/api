import { AppError } from '../../shared/utils/app-error';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, UpdatePOStatusDto, QueryPurchaseOrdersDto, AddPOItemDto, UpdatePOItemDto, ApprovePODto, ReceivePODto, ReceivePOWithItemsDto, CancelPODto } from './purchaseorder.dto';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  Product,
  ProductCategory,
  Location,
  ProductInventory,
  ProductStockMovement,
  POStatusHistory,
  GoodsReceipt,
  SupplierPayment,
} from '../../models';
import { Op, fn, col, QueryTypes } from 'sequelize';
import sequelize from '../../shared/config/database';

export class PurchaseOrderService {
  // Generate unique PO number
  async generatePONumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastPO = await PurchaseOrder.findOne({
      where: {
        poNumber: {
          [Op.like]: `PO-${year}-%`
        }
      },
      order: [['poNumber', 'DESC']],
      attributes: ['poNumber'],
    });

    if (!lastPO) {
      return `PO-${year}-0001`;
    }

    const lastNumber = parseInt(lastPO.poNumber.split('-')[2]);
    const newNumber = lastNumber + 1;
    return `PO-${year}-${newNumber.toString().padStart(4, '0')}`;
  }

  // Calculate PO totals
  private calculateTotals(items: any[], shippingCost: number = 0, discountAmount: number = 0) {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * parseFloat(item.unitPrice?.toString() || '0');
      const discount = (itemTotal * parseFloat(item.discountPercent?.toString() || '0')) / 100;
      const tax = ((itemTotal - discount) * parseFloat(item.taxRate?.toString() || '0')) / 100;
      return sum + itemTotal - discount + tax;
    }, 0);

    const taxAmount = items.reduce((sum, item) => {
      const itemTotal = item.quantity * parseFloat(item.unitPrice?.toString() || '0');
      const discount = (itemTotal * parseFloat(item.discountPercent?.toString() || '0')) / 100;
      const tax = ((itemTotal - discount) * parseFloat(item.taxRate?.toString() || '0')) / 100;
      return sum + tax;
    }, 0);

    const totalAmount = subtotal + shippingCost - discountAmount;

    return {
      subtotal,
      taxAmount,
      totalAmount,
      balanceAmount: totalAmount,
    };
  }

  // Create purchase order
  async createPurchaseOrder(data: CreatePurchaseOrderDto, createdBy?: string) {
    const poNumber = await this.generatePONumber();

    // Validate supplier
    const supplier = await Supplier.findByPk(data.supplierId);
    if (!supplier) throw new AppError(404, 'Supplier not found');

    // Validate products
    for (const item of data.items) {
      const product = await Product.findByPk(item.productId);
      if (!product) throw new AppError(404, `Product ${item.productId} not found`);
    }

    // Calculate totals
    const totals = this.calculateTotals(data.items, data.shippingCost, data.discountAmount);

    return await sequelize.transaction(async (t) => {
      // Create PO
      const po = await PurchaseOrder.create({
        poNumber,
        supplierId: data.supplierId,
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
        priority: data.priority,
        status: 'DRAFT',
        paymentTerms: data.paymentTerms,
        shippingMethod: data.shippingMethod,
        shippingAddress: data.shippingAddress,
        shippingCost: data.shippingCost,
        discountAmount: data.discountAmount,
        notes: data.notes,
        internalNotes: data.internalNotes,
        ...totals,
        paidAmount: 0,
      }, { transaction: t });

      await po.reload({
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'supplier_code']
          }
        ],
        transaction: t
      });

      // Create PO items
      const items = await Promise.all(
        data.items.map(async (item) => {
          const itemTotal = item.quantity * item.unitPrice;
          const discount = (itemTotal * (item.discountPercent || 0)) / 100;
          const totalPrice = itemTotal - discount;

          const poItem = await PurchaseOrderItem.create({
            purchaseOrderId: po.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            discountPercent: item.discountPercent || 0,
            totalPrice,
            notes: item.notes,
          }, { transaction: t });

          await poItem.reload({
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['product_code', 'name']
              }
            ],
            transaction: t
          });

          return poItem;
        })
      );

      // Create status history
      await POStatusHistory.create({
        purchaseOrderId: po.id,
        toStatus: 'DRAFT',
        remarks: 'Purchase order created',
      }, { transaction: t });

      return { ...po.toJSON(), items: items.map(i => i.toJSON()) };
    });
  }

  // Get all purchase orders
  async getPurchaseOrders(query: QueryPurchaseOrdersDto) {
    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const offset = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where[Op.or] = [
        { poNumber: { [Op.iLike]: `%${query.search}%` } },
        // For supplier name search, we'll need to use a join or subquery
      ];
    }

    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;

    if (query.fromDate || query.toDate) {
      where.orderDate = {};
      if (query.fromDate) where.orderDate[Op.gte] = new Date(query.fromDate);
      if (query.toDate) where.orderDate[Op.lte] = new Date(query.toDate);
    }

    // Handle supplier name search with join
    if (query.search && !query.supplierId) {
      const suppliers = await Supplier.findAll({
        where: { name: { [Op.iLike]: `%${query.search}%` } },
        attributes: ['id']
      });
      if (suppliers.length > 0) {
        where.supplierId = { [Op.in]: suppliers.map(s => s.id) };
      } else if (!where[Op.or]) {
        // If no suppliers found and no other OR conditions, return empty
        where.id = { [Op.in]: [] };
      }
    }

    const { count, rows: purchaseOrders } = await PurchaseOrder.findAndCountAll({
      where,
      offset,
      limit,
      order: [[query.sortBy, query.sortOrder]],
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'supplier_code', 'phone']
        },
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'product_code', 'name']
            }
          ]
        }
      ],
      distinct: true
    });

    // Get counts for each PO
    const posWithCounts = await Promise.all(
      purchaseOrders.map(async (po) => {
        const [receiptsCount, paymentsCount] = await Promise.all([
          GoodsReceipt.count({ where: { purchaseOrderId: po.id } }),
          SupplierPayment.count({ where: { purchaseOrderId: po.id } }),
        ]);

        return {
          ...po.toJSON(),
          _count: {
            receipts: receiptsCount,
            payments: paymentsCount,
          },
        };
      })
    );

    return {
      data: posWithCounts,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Get purchase order by ID
  async getPurchaseOrderById(id: string) {
    const po = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: Supplier,
          as: 'supplier'
        },
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                {
                  model: ProductCategory,
                  as: 'category',
                  attributes: ['name']
                }
              ]
            }
          ]
        },
        {
          model: GoodsReceipt,
          as: 'receipts',
          include: [
            {
              association: 'items'
            }
          ]
        },
        {
          model: SupplierPayment,
          as: 'payments',
          attributes: ['id', 'payment_number', 'amount', 'payment_method', 'payment_date']
        },
        {
          model: POStatusHistory,
          as: 'statusHistory',
          order: [['changed_at', 'DESC']]
        }
      ]
    });

    if (!po) throw new AppError(404, 'Purchase order not found');

    return po.toJSON();
  }

  // Update purchase order
  async updatePurchaseOrder(id: string, data: UpdatePurchaseOrderDto) {
    const po = await PurchaseOrder.findByPk(id);
    if (!po) throw new AppError(404, 'Purchase order not found');

    if (po.status !== 'DRAFT') {
      throw new AppError(400, 'Only draft purchase orders can be updated');
    }

    const updateData: any = { ...data };
    if (data.expectedDate) updateData.expectedDate = new Date(data.expectedDate);

    // Recalculate totals if shipping or discount changed
    if (data.shippingCost !== undefined || data.discountAmount !== undefined) {
      const items = await PurchaseOrderItem.findAll({
        where: { purchaseOrderId: id },
      });
      const totals = this.calculateTotals(
        items,
        data.shippingCost ?? Number(po.shippingCost || 0),
        data.discountAmount ?? Number(po.discountAmount || 0)
      );
      Object.assign(updateData, totals);
    }

    await PurchaseOrder.update(updateData, {
      where: { id }
    });

    await po.reload({
      include: [
        {
          model: Supplier,
          as: 'supplier'
        },
        {
          model: PurchaseOrderItem,
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

    return po.toJSON();
  }

  // Update PO status
  async updatePOStatus(id: string, data: UpdatePOStatusDto, changedBy?: string) {
    const po = await PurchaseOrder.findByPk(id);
    if (!po) throw new AppError(404, 'Purchase order not found');

    return await sequelize.transaction(async (t) => {
      const updateData: any = {
        status: data.status,
      };
      if (data.status === 'RECEIVED') {
        updateData.receivedDate = new Date();
      }

      await PurchaseOrder.update(updateData, {
        where: { id },
        transaction: t
      });

      await POStatusHistory.create({
        purchaseOrderId: id,
        fromStatus: po.status,
        toStatus: data.status,
        changedBy,
        remarks: data.remarks,
      }, { transaction: t });

      const updated = await PurchaseOrder.findByPk(id, { transaction: t });
      return updated?.toJSON();
    });
  }

  // Approve purchase order
  async approvePurchaseOrder(id: string, data: ApprovePODto, userId?: string) {
    const po = await PurchaseOrder.findByPk(id);
    if (!po) throw new AppError(404, 'Purchase order not found');

    if (po.status !== 'DRAFT') {
      throw new AppError(400, 'Only draft purchase orders can be approved');
    }

    const approvedBy = data.approvedBy || userId;
    if (!approvedBy) {
      throw new AppError(401, 'Authentication required: User ID not found');
    }

    return await sequelize.transaction(async (t) => {
      await PurchaseOrder.update({
        status: 'SUBMITTED',
        approvedBy,
        approvedAt: new Date(),
      }, {
        where: { id },
        transaction: t
      });

      await POStatusHistory.create({
        purchaseOrderId: id,
        fromStatus: po.status,
        toStatus: 'SUBMITTED',
        changedBy: approvedBy,
        remarks: data.notes || 'Purchase order approved and submitted',
      }, { transaction: t });

      const updated = await PurchaseOrder.findByPk(id, { transaction: t });
      return updated?.toJSON();
    });
  }

  // Receive purchase order (with automatic inventory update)
  async receivePurchaseOrder(id: string, data: ReceivePODto, userId?: string) {
    const po = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: PurchaseOrderItem,
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

    if (!po) throw new AppError(404, 'Purchase order not found');

    if (!['SUBMITTED', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      throw new AppError(400, 'Purchase order must be submitted, confirmed, or partially received to be received');
    }

    const receivedBy = data.receivedBy || userId;
    if (!receivedBy) {
      throw new AppError(401, 'Authentication required: User ID not found');
    }

    return await sequelize.transaction(async (t) => {
      // Update PO status
      await PurchaseOrder.update({
        status: 'RECEIVED',
      }, {
        where: { id },
        transaction: t
      });

      // Create status history
      await POStatusHistory.create({
        purchaseOrderId: id,
        fromStatus: po.status,
        toStatus: 'RECEIVED',
        changedBy: receivedBy,
        remarks: data.notes || 'Purchase order fully received',
      }, { transaction: t });

      // Auto-update inventory if enabled
      if (data.autoUpdateInventory !== false) {
        for (const item of po.items!) {
          // Check if inventory exists for this product and location - find by composite key
          const existingInventory = await ProductInventory.findOne({
            where: {
              productId: item.productId,
              locationId: data.locationId
            },
            transaction: t
          });

          const quantityBefore = existingInventory?.quantity || 0;
          const quantityAfter = quantityBefore + item.quantity;

          if (existingInventory) {
            // Update existing inventory
            const newAvailableQuantity = quantityAfter - existingInventory.reservedQuantity;
            await ProductInventory.update({
              quantity: quantityAfter,
              availableQuantity: newAvailableQuantity,
              lastRestocked: new Date(),
            }, {
              where: {
                productId: item.productId,
                locationId: data.locationId
              },
              transaction: t
            });
          } else {
            // Create new inventory record
            await ProductInventory.create({
              productId: item.productId,
              locationId: data.locationId,
              quantity: item.quantity,
              availableQuantity: item.quantity,
              storageLocation: 'Main Storage',
              lastRestocked: new Date(),
            }, { transaction: t });
          }

          // Create stock movement record
          await ProductStockMovement.create({
            productId: item.productId,
            locationId: data.locationId,
            movementType: 'PURCHASE',
            quantity: item.quantity,
            quantityBefore: quantityBefore,
            quantityAfter: quantityAfter,
            referenceType: 'PURCHASE_ORDER',
            referenceId: po.id,
            notes: `PO ${po.poNumber} received - ${item.product?.name || ''}`,
          }, { transaction: t });
        }
      }

      const updated = await PurchaseOrder.findByPk(id, { transaction: t });
      return updated?.toJSON();
    });
  }

  // Receive purchase order with specific items (partial receive)
  async receivePurchaseOrderWithItems(id: string, data: ReceivePOWithItemsDto, userId?: string) {
    const po = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: PurchaseOrderItem,
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

    if (!po) throw new AppError(404, 'Purchase order not found');

    if (!['SUBMITTED', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      throw new AppError(400, 'Purchase order must be submitted, confirmed, or partially received');
    }

    const receivedBy = data.receivedBy || userId;
    if (!receivedBy) {
      throw new AppError(401, 'Authentication required: User ID not found');
    }

    // Validate that all received items are in the PO and check cumulative received quantities
    for (const receivedItem of data.items) {
      const poItem = po.items!.find(item => item.productId === receivedItem.productId);
      if (!poItem) {
        throw new AppError(400, `Product ${receivedItem.productId} is not in this purchase order`);
      }

      // Calculate total quantity that will be received after this operation
      const currentReceivedQty = poItem.receivedQuantity || 0;
      const newTotalReceived = currentReceivedQty + receivedItem.quantityReceived;
      const orderedQty = poItem.quantity;

      // Check if total received exceeds ordered quantity
      if (newTotalReceived > orderedQty) {
        const remainingQty = orderedQty - currentReceivedQty;
        throw new AppError(
          400,
          `Cannot receive ${receivedItem.quantityReceived} units of ${poItem.product?.name || ''}. ` +
          `Ordered: ${orderedQty}, Already received: ${currentReceivedQty}, ` +
          `Remaining: ${remainingQty}. You can only receive up to ${remainingQty} more units.`
        );
      }

      // Validate positive quantity
      if (receivedItem.quantityReceived <= 0) {
        throw new AppError(400, `Quantity received must be greater than 0 for product ${poItem.product?.name || ''}`);
      }
    }

    // Check if all items are fully received
    const allItemsReceived = po.items!.every(poItem => {
      const receivedItem = data.items.find(ri => ri.productId === poItem.productId);
      return receivedItem && receivedItem.quantityReceived === poItem.quantity;
    });

    const newStatus = allItemsReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

    return await sequelize.transaction(async (t) => {
      // Update PO status
      await PurchaseOrder.update({
        status: newStatus,
      }, {
        where: { id },
        transaction: t
      });

      // Create status history
      await POStatusHistory.create({
        purchaseOrderId: id,
        fromStatus: po.status,
        toStatus: newStatus,
        changedBy: receivedBy,
        remarks: data.notes || `Partially received: ${data.items.length} item(s)`,
      }, { transaction: t });

      // Update received quantities on PO items
      for (const receivedItem of data.items) {
        const poItem = po.items!.find(item => item.productId === receivedItem.productId);
        if (!poItem) continue;

        // Increment receivedQuantity
        const currentReceivedQty = poItem.receivedQuantity || 0;
        await PurchaseOrderItem.update({
          receivedQuantity: currentReceivedQty + receivedItem.quantityReceived,
        }, {
          where: { id: poItem.id },
          transaction: t
        });
      }

      // Auto-update inventory if enabled
      if (data.autoUpdateInventory !== false) {
        for (const receivedItem of data.items) {
          const poItem = po.items!.find(item => item.productId === receivedItem.productId);
          if (!poItem) continue;

          // Check if inventory exists for this product and location
          const existingInventory = await ProductInventory.findOne({
            where: {
              productId: receivedItem.productId,
              locationId: data.locationId
            },
            transaction: t
          });

          const quantityBefore = existingInventory?.quantity || 0;
          const quantityAfter = quantityBefore + receivedItem.quantityReceived;

          if (existingInventory) {
            // Update existing inventory
            const newAvailableQuantity = quantityAfter - existingInventory.reservedQuantity;
            await ProductInventory.update({
              quantity: quantityAfter,
              availableQuantity: newAvailableQuantity,
              lastRestocked: new Date(),
            }, {
              where: {
                productId: receivedItem.productId,
                locationId: data.locationId
              },
              transaction: t
            });
          } else {
            // Create new inventory record
            await ProductInventory.create({
              productId: receivedItem.productId,
              locationId: data.locationId,
              quantity: receivedItem.quantityReceived,
              availableQuantity: receivedItem.quantityReceived,
              storageLocation: 'Main Storage',
              lastRestocked: new Date(),
            }, { transaction: t });
          }

          // Create stock movement record
          const currentReceivedQty = (poItem.receivedQuantity || 0) + receivedItem.quantityReceived;
          await ProductStockMovement.create({
            productId: receivedItem.productId,
            locationId: data.locationId,
            movementType: 'PURCHASE',
            quantity: receivedItem.quantityReceived,
            quantityBefore: quantityBefore,
            quantityAfter: quantityAfter,
            referenceType: 'PURCHASE_ORDER',
            referenceId: po.id,
            notes: `PO ${po.poNumber} received (partial) - ${poItem.product?.name || ''}: ${currentReceivedQty}/${poItem.quantity}`,
          }, { transaction: t });
        }
      }

      const updated = await PurchaseOrder.findByPk(id, { transaction: t });
      return {
        ...updated?.toJSON(),
        receivedItems: data.items.length,
        totalItems: po.items!.length,
      };
    });
  }

  // Cancel purchase order
  async cancelPurchaseOrder(id: string, data: CancelPODto, userId?: string) {
    const po = await PurchaseOrder.findByPk(id);
    if (!po) throw new AppError(404, 'Purchase order not found');

    if (['COMPLETED', 'RECEIVED', 'CANCELLED'].includes(po.status)) {
      throw new AppError(400, 'Cannot cancel completed, received, or already cancelled purchase orders');
    }

    const cancelledBy = data.cancelledBy || userId;
    if (!cancelledBy) {
      throw new AppError(401, 'Authentication required: User ID not found');
    }

    return await sequelize.transaction(async (t) => {
      await PurchaseOrder.update({
        status: 'CANCELLED',
      }, {
        where: { id },
        transaction: t
      });

      await POStatusHistory.create({
        purchaseOrderId: id,
        fromStatus: po.status,
        toStatus: 'CANCELLED',
        changedBy: cancelledBy,
        remarks: data.reason || 'Purchase order cancelled',
      }, { transaction: t });

      const updated = await PurchaseOrder.findByPk(id, { transaction: t });
      return updated?.toJSON();
    });
  }

  // Delete purchase order
  async deletePurchaseOrder(id: string) {
    const po = await PurchaseOrder.findByPk(id);
    if (!po) throw new AppError(404, 'Purchase order not found');

    if (po.status !== 'DRAFT') {
      throw new AppError(400, 'Only draft purchase orders can be deleted');
    }

    const [receiptsCount, paymentsCount] = await Promise.all([
      GoodsReceipt.count({ where: { purchaseOrderId: id } }),
      SupplierPayment.count({ where: { purchaseOrderId: id } }),
    ]);

    if (receiptsCount > 0 || paymentsCount > 0) {
      throw new AppError(400, 'Cannot delete purchase order with receipts or payments');
    }

    await PurchaseOrder.destroy({ where: { id } });
    return { message: 'Purchase order deleted successfully' };
  }

  // Add item to PO
  async addPOItem(poId: string, data: AddPOItemDto) {
    const po = await PurchaseOrder.findByPk(poId);
    if (!po) throw new AppError(404, 'Purchase order not found');

    if (po.status !== 'DRAFT') {
      throw new AppError(400, 'Cannot add items to non-draft purchase orders');
    }

    const product = await Product.findByPk(data.productId);
    if (!product) throw new AppError(404, 'Product not found');

    const itemTotal = data.quantity * data.unitPrice;
    const discount = (itemTotal * (data.discountPercent || 0)) / 100;
    const totalPrice = itemTotal - discount;

    return await sequelize.transaction(async (t) => {
      const item = await PurchaseOrderItem.create({
        purchaseOrderId: poId,
        productId: data.productId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        taxRate: data.taxRate || 0,
        discountPercent: data.discountPercent || 0,
        totalPrice,
        notes: data.notes,
      }, { transaction: t });

      await item.reload({
        include: [
          {
            model: Product,
            as: 'product'
          }
        ],
        transaction: t
      });

      // Recalculate PO totals
      const allItems = await PurchaseOrderItem.findAll({
        where: { purchaseOrderId: poId },
        transaction: t
      });
      const totals = this.calculateTotals(
        allItems,
        Number(po.shippingCost || 0),
        Number(po.discountAmount || 0)
      );

      await PurchaseOrder.update(totals, {
        where: { id: poId },
        transaction: t
      });

      return item.toJSON();
    });
  }

  // Update PO item
  async updatePOItem(poId: string, itemId: string, data: UpdatePOItemDto) {
    const po = await PurchaseOrder.findByPk(poId);
    if (!po) throw new AppError(404, 'Purchase order not found');

    if (po.status !== 'DRAFT') {
      throw new AppError(400, 'Cannot update items in non-draft purchase orders');
    }

    const item = await PurchaseOrderItem.findByPk(itemId);
    if (!item || item.purchaseOrderId !== poId) {
      throw new AppError(404, 'Purchase order item not found');
    }

    return await sequelize.transaction(async (t) => {
      const updateData: any = { ...data };

      // Recalculate item total if quantity or price changed
      if (data.quantity !== undefined || data.unitPrice !== undefined || data.discountPercent !== undefined) {
        const quantity = data.quantity ?? item.quantity;
        const unitPrice = data.unitPrice ?? Number(item.unitPrice || 0);
        const discountPercent = data.discountPercent ?? Number(item.discountPercent || 0);

        const itemTotal = quantity * unitPrice;
        const discount = (itemTotal * discountPercent) / 100;
        updateData.totalPrice = itemTotal - discount;
      }

      await PurchaseOrderItem.update(updateData, {
        where: { id: itemId },
        transaction: t
      });

      await item.reload({
        include: [
          {
            model: Product,
            as: 'product'
          }
        ],
        transaction: t
      });

      // Recalculate PO totals
      const allItems = await PurchaseOrderItem.findAll({
        where: { purchaseOrderId: poId },
        transaction: t
      });
      const totals = this.calculateTotals(
        allItems,
        Number(po.shippingCost || 0),
        Number(po.discountAmount || 0)
      );

      await PurchaseOrder.update(totals, {
        where: { id: poId },
        transaction: t
      });

      return item.toJSON();
    });
  }

  // Delete PO item
  async deletePOItem(poId: string, itemId: string) {
    const po = await PurchaseOrder.findByPk(poId);
    if (!po) throw new AppError(404, 'Purchase order not found');

    if (po.status !== 'DRAFT') {
      throw new AppError(400, 'Cannot delete items from non-draft purchase orders');
    }

    const item = await PurchaseOrderItem.findByPk(itemId);
    if (!item || item.purchaseOrderId !== poId) {
      throw new AppError(404, 'Purchase order item not found');
    }

    return await sequelize.transaction(async (t) => {
      await PurchaseOrderItem.destroy({
        where: { id: itemId },
        transaction: t
      });

      // Recalculate PO totals
      const allItems = await PurchaseOrderItem.findAll({
        where: { purchaseOrderId: poId },
        transaction: t
      });

      if (allItems.length === 0) {
        // If no items left, reset totals
        await PurchaseOrder.update({
          subtotal: 0,
          taxAmount: 0,
          totalAmount: 0,
          balanceAmount: 0,
        }, {
          where: { id: poId },
          transaction: t
        });
      } else {
        const totals = this.calculateTotals(
          allItems,
          Number(po.shippingCost || 0),
          Number(po.discountAmount || 0)
        );

        await PurchaseOrder.update(totals, {
          where: { id: poId },
          transaction: t
        });
      }

      return { message: 'Purchase order item deleted successfully' };
    });
  }

  // Get PO statistics
  async getPOStats() {
    const [total, byStatusQuery, totalValueQuery, pendingValueQuery] = await Promise.all([
      PurchaseOrder.count(),
      // Use raw query for groupBy
      sequelize.query<{ status: string; count: string }>(
        'SELECT status, COUNT(*) as count FROM purchase_orders GROUP BY status',
        { type: QueryTypes.SELECT }
      ),
      PurchaseOrder.findAll({
        attributes: [
          [fn('SUM', col('total_amount')), 'totalAmount']
        ],
        raw: true
      }) as Promise<any[]>,
      PurchaseOrder.findAll({
        where: {
          status: { [Op.in]: ['DRAFT', 'SUBMITTED', 'CONFIRMED'] }
        },
        attributes: [
          [fn('SUM', col('total_amount')), 'totalAmount']
        ],
        raw: true
      }) as Promise<any[]>,
    ]);

    const byStatus = byStatusQuery.map(item => ({
      status: item.status,
      _count: parseInt(item.count) || 0
    }));

    return {
      total,
      byStatus,
      totalValue: totalValueQuery[0]?.totalAmount ? parseFloat(totalValueQuery[0].totalAmount) : null,
      pendingValue: pendingValueQuery[0]?.totalAmount ? parseFloat(pendingValueQuery[0].totalAmount) : null,
    };
  }
}

