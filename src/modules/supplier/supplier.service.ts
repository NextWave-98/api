import { AppError } from '../../shared/utils/app-error';
import { CreateSupplierDto, UpdateSupplierDto, QuerySuppliersDto, AddSupplierProductDto, UpdateSupplierProductDto } from './supplier.dto';
import {
  Supplier,
  SupplierProduct,
  Product,
  ProductCategory,
  PurchaseOrder,
  SupplierReturn,
  SupplierPayment,
} from '../../models';
import { Op, fn, col, QueryTypes } from 'sequelize';


export class SupplierService {
  // Generate unique supplier code
  async generateSupplierCode(): Promise<string> {
    const lastSupplier = await Supplier.findOne({
      order: [['supplierCode', 'DESC']],
      attributes: ['supplierCode'],
    });

    if (!lastSupplier) {
      return 'SUP-0001';
    }

    const lastNumber = parseInt(lastSupplier.supplierCode.split('-')[1]);
    const newNumber = lastNumber + 1;
    return `SUP-${newNumber.toString().padStart(4, '0')}`;
  }

  // Create supplier
  async createSupplier(data: CreateSupplierDto) {
    const supplierCode = await this.generateSupplierCode();

    // Check for duplicate email
    if (data.email) {
      const existing = await Supplier.findOne({ where: { email: data.email } });
      if (existing) throw new AppError(400, 'Email already exists');
    }

    // Check for duplicate taxId
    if (data.taxId && data.taxId.trim() !== '') {
      const existing = await Supplier.findOne({ where: { taxId: data.taxId } });
      if (existing) throw new AppError(400, 'Tax ID already exists');
    }

    // Check for duplicate registrationNumber
    if (data.registrationNumber && data.registrationNumber.trim() !== '') {
      const existing = await Supplier.findOne({ where: { registrationNumber: data.registrationNumber } });
      if (existing) throw new AppError(400, 'Registration number already exists');
    }

    const supplier = await Supplier.create({
      ...data,
      supplierCode,
    });

    return supplier.toJSON();
  }

  // Get all suppliers with pagination
  async getSuppliers(query: QuerySuppliersDto) {
    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const offset = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { companyName: { [Op.iLike]: `%${query.search}%` } },
        { supplierCode: { [Op.iLike]: `%${query.search}%` } },
        { email: { [Op.iLike]: `%${query.search}%` } },
        { phone: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    if (query.supplierType) where.supplierType = query.supplierType;
    if (query.status) where.status = query.status;
    if (query.city) where.city = { [Op.iLike]: `%${query.city}%` };
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const { count, rows: suppliers } = await Supplier.findAndCountAll({
      where,
      offset,
      limit,
      order: [[query.sortBy, query.sortOrder]],
    });

    // Get counts for each supplier
    const suppliersWithCounts = await Promise.all(
      suppliers.map(async (supplier) => {
        const [supplierProductsCount, purchaseOrdersCount, supplierReturnsCount, supplierPaymentsCount] = await Promise.all([
          SupplierProduct.count({ where: { supplierId: supplier.id } }),
          PurchaseOrder.count({ where: { supplierId: supplier.id } }),
          SupplierReturn.count({ where: { supplierId: supplier.id } }),
          SupplierPayment.count({ where: { supplierId: supplier.id } }),
        ]);

        return {
          ...supplier.toJSON(),
          _count: {
            supplierProducts: supplierProductsCount,
            purchaseOrders: purchaseOrdersCount,
            supplierReturns: supplierReturnsCount,
            supplierPayments: supplierPaymentsCount,
          },
        };
      })
    );

    return {
      data: suppliersWithCounts,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Get supplier by ID
  async getSupplierById(id: string) {
    const supplier = await Supplier.findByPk(id, {
      include: [
        {
          model: SupplierProduct,
          as: 'supplierProducts',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'productCode', 'name', 'brand', 'model', 'unitPrice']
            }
          ]
        }
      ]
    });

    if (!supplier) {
      throw new AppError(404, 'Supplier not found');
    }

    // Get counts
    const [purchaseOrdersCount, supplierReturnsCount, supplierPaymentsCount] = await Promise.all([
      PurchaseOrder.count({ where: { supplierId: id } }),
      SupplierReturn.count({ where: { supplierId: id } }),
      SupplierPayment.count({ where: { supplierId: id } }),
    ]);

    // Calculate outstanding balance
    const purchaseOrders = await PurchaseOrder.findAll({
      where: { supplierId: id },
      attributes: ['balanceAmount'],
    });

    const outstandingBalance = purchaseOrders.reduce(
      (sum, po) => sum + Number(po.balanceAmount || 0),
      0
    );

    return {
      ...supplier.toJSON(),
      _count: {
        purchaseOrders: purchaseOrdersCount,
        supplierReturns: supplierReturnsCount,
        supplierPayments: supplierPaymentsCount,
      },
      outstandingBalance,
    };
  }

  // Update supplier
  async updateSupplier(id: string, data: UpdateSupplierDto) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) throw new AppError(404, 'Supplier not found');

    // Check for duplicate email
    if (data.email && data.email !== supplier.email) {
      const existing = await Supplier.findOne({ where: { email: data.email } });
      if (existing) throw new AppError(400, 'Email already exists');
    }

    // Check for duplicate taxId
    if (data.taxId && data.taxId !== supplier.taxId) {
      const existing = await Supplier.findOne({ where: { taxId: data.taxId } });
      if (existing) throw new AppError(400, 'Tax ID already exists');
    }

    await Supplier.update(data, {
      where: { id }
    });

    await supplier.reload();
    return supplier.toJSON();
  }

  // Delete supplier
  async deleteSupplier(id: string) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) throw new AppError(404, 'Supplier not found');

    // Check if supplier has purchase orders
    const purchaseOrdersCount = await PurchaseOrder.count({ where: { supplierId: id } });
    if (purchaseOrdersCount > 0) {
      throw new AppError(400, 'Cannot delete supplier with existing purchase orders');
    }

    await Supplier.destroy({ where: { id } });
    return { message: 'Supplier deleted successfully' };
  }

  // Add product to supplier
  async addSupplierProduct(supplierId: string, data: AddSupplierProductDto) {
    // Validate supplier exists
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) throw new AppError(404, 'Supplier not found');

    // Validate product exists
    const product = await Product.findByPk(data.productId);
    if (!product) throw new AppError(404, 'Product not found');

    // Check if mapping already exists - find by composite key
    const existing = await SupplierProduct.findOne({
      where: {
        supplierId,
        productId: data.productId
      }
    });

    if (existing) throw new AppError(400, 'Product already added to this supplier');

    // If setting as primary, unset other primary suppliers for this product
    if (data.isPrimary) {
      await SupplierProduct.update(
        { isPrimary: false },
        { where: { productId: data.productId, isPrimary: true } }
      );
    }

    const supplierProduct = await SupplierProduct.create({
      supplierId,
      ...data,
    });

    await supplierProduct.reload({
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'productCode', 'name', 'brand', 'model']
        }
      ]
    });

    return supplierProduct.toJSON();
  }

  // Update supplier product
  async updateSupplierProduct(supplierId: string, productId: string, data: UpdateSupplierProductDto) {
    const supplierProduct = await SupplierProduct.findOne({
      where: {
        supplierId,
        productId
      }
    });

    if (!supplierProduct) throw new AppError(404, 'Supplier product mapping not found');

    // If setting as primary, unset other primary suppliers for this product
    if (data.isPrimary) {
      await SupplierProduct.update(
        { isPrimary: false },
        { where: { productId, isPrimary: true, supplierId: { [Op.ne]: supplierId } } }
      );
    }

    await SupplierProduct.update(data, {
      where: {
        supplierId,
        productId
      }
    });

    await supplierProduct.reload({
      include: [
        {
          model: Product,
          as: 'product'
        }
      ]
    });

    return supplierProduct.toJSON();
  }

  // Remove product from supplier
  async removeSupplierProduct(supplierId: string, productId: string) {
    const supplierProduct = await SupplierProduct.findOne({
      where: {
        supplierId,
        productId
      }
    });

    if (!supplierProduct) throw new AppError(404, 'Supplier product mapping not found');

    await SupplierProduct.destroy({
      where: {
        supplierId,
        productId
      }
    });

    return { message: 'Product removed from supplier successfully' };
  }

  // Get supplier products
  async getSupplierProducts(supplierId: string) {
    const supplierProducts = await SupplierProduct.findAll({
      where: { supplierId },
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
    });

    return supplierProducts.map(sp => sp.toJSON());
  }

  // Get supplier statistics
  async getSupplierStats() {
    const [
      total,
      active,
      byTypeQuery,
      byStatusQuery,
      purchaseOrdersQuery,
      purchaseOrderAggregate,
      paymentAggregate,
    ] = await Promise.all([
      Supplier.count(),
      Supplier.count({ where: { isActive: true } }),
      // Use Sequelize model queries for grouping to respect model/DB naming mappings
      Supplier.findAll({
        attributes: ['supplier_type', [fn('COUNT', col('id')), 'count']],
        group: ['supplier_type'],
        raw: true,
      }) as Promise<any[]>,
      Supplier.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }) as Promise<any[]>,
      PurchaseOrder.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }) as Promise<any[]>,
      PurchaseOrder.findAll({
        attributes: [
          [fn('SUM', col('total_amount')), 'totalAmount'],
          [fn('SUM', col('balance_amount')), 'balanceAmount'],
          [fn('COUNT', col('id')), 'count']
        ],
        raw: true
      }) as Promise<any[]>,
      SupplierPayment.findAll({
        attributes: [
          [fn('SUM', col('amount')), 'amount']
        ],
        raw: true
      }) as Promise<any[]>,
    ]);

    // Calculate pending orders (DRAFT, PENDING, APPROVED, ORDERED)
    const pendingStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED'];
    const purchaseOrders = purchaseOrdersQuery.map(po => ({
      status: po.status,
      _count: parseInt(po.count) || 0
    }));
    const pendingOrders = purchaseOrders
      .filter(po => pendingStatuses.includes(po.status))
      .reduce((sum, po) => sum + po._count, 0);

    // Calculate total purchase value and outstanding payments
    const totalPurchaseValue = purchaseOrderAggregate[0]?.totalAmount
      ? parseFloat(purchaseOrderAggregate[0].totalAmount)
      : 0;

    const outstandingPayments = purchaseOrderAggregate[0]?.balanceAmount
      ? parseFloat(purchaseOrderAggregate[0].balanceAmount)
      : 0;

    const totalPaid = paymentAggregate[0]?.amount
      ? parseFloat(paymentAggregate[0].amount)
      : 0;

    return {
      totalSuppliers: total,
      total,
      active,
      inactive: total - active,
      byType: byTypeQuery.map(item => ({
        supplierType: item.supplier_type,
        _count: parseInt(item.count) || 0
      })),
      byStatus: byStatusQuery.map(item => ({
        status: item.status,
        _count: parseInt(item.count) || 0
      })),
      // Purchase order stats
      totalPurchaseOrders: parseInt(purchaseOrderAggregate[0]?.count) || 0,
      pendingOrders,
      purchaseOrdersByStatus: purchaseOrders,
      // Financial stats
      totalPurchaseValue,
      outstandingPayments,
      totalPaid,
    };
  }

  // Get supplier performance
  async getSupplierPerformance(supplierId: string) {
    const [purchaseOrders, returns, payments] = await Promise.all([
      PurchaseOrder.findAll({
        where: { supplierId },
        attributes: ['status', 'totalAmount', 'balanceAmount', 'orderDate', 'receivedDate'],
      }),
      SupplierReturn.findAll({
        where: { supplierId },
        attributes: ['returnType', 'status', 'totalAmount'],
      }),
      SupplierPayment.findAll({
        where: { supplierId },
        attributes: ['amount', 'paymentDate'],
      }),
    ]);

    const totalOrders = purchaseOrders.length;
    const completedOrders = purchaseOrders.filter(po => po.status === 'COMPLETED').length;
    const totalPurchaseValue = purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalReturns = returns.length;
    const totalReturnValue = returns.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);

    return {
      totalOrders,
      completedOrders,
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      totalPurchaseValue,
      totalPaid,
      totalReturns,
      totalReturnValue,
      returnRate: totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0,
    };
  }
}

