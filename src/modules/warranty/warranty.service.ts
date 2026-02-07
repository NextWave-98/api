import { AppError } from '../../shared/utils/app-error';
import { WarrantyStatus, ClaimStatus, WarrantyType } from '../../enums';
import { BusinessService } from '../business/business.service';
import {
  WarrantyCard,
  WarrantyClaim,
  SaleItem,
  Sale,
  Product,
  Customer,
  Location,
  User,
  JobSheet,
} from '../../models';
import { Op, fn, col, QueryTypes } from 'sequelize';
import sequelize  from '../../shared/config/database';
const PDFDocument = require('pdfkit');
const axios = require('axios');
import {
  CreateWarrantyCardDTO,
  TransferWarrantyDTO,
  VoidWarrantyDTO,
  QueryWarrantyCardsDTO,
  CreateWarrantyClaimDTO,
  UpdateClaimStatLKRTO,
  ResolveClaimDTO,
  AssignClaimDTO,
  QueryWarrantyClaimsDTO,
  WarrantyAnalyticsQueryDTO,
  WarrantyAnalyticsDTO,
  DownloadWarrantyCardDTO,
  PrintWarrantyCardDTO,
} from './warranty.dto';

export class WarrantyService {
  /**
   * Generate unique warranty number
   */
  private async generateWarrantyNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `WRN-${year}-`;

    const lastWarranty = await WarrantyCard.findOne({
      where: { warrantyNumber: { [Op.like]: `${prefix}%` } },
      order: [['warrantyNumber', 'DESC']],
    });

    let nextNumber = 1;
    if (lastWarranty && lastWarranty.warrantyNumber) {
      const lastNumber = parseInt(lastWarranty.warrantyNumber.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Generate unique claim number
   */
  private async generateClaimNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CLM-${year}-`;

    const lastClaim = await WarrantyClaim.findOne({
      where: { claimNumber: { [Op.like]: `${prefix}%` } },
      order: [['claim_number', 'DESC']],
    });

    let nextNumber = 1;
    if (lastClaim) {
      const lastNumber = parseInt(lastClaim.claimNumber.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Calculate expiry date based on warranty months
   */
  private calculateExpiryDate(startDate: Date, months: number): Date {
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + months);
    return expiryDate;
  }

  /**
   * Auto-generate warranty card from sale item
   * Called when a sale is completed
   */
  async generateWarrantyFromSaleItem(saleItemId: string): Promise<any> {
    // Get sale item with product details
    const saleItem = await SaleItem.findByPk(saleItemId, {
      include: [
        {
          model: Sale,
          as: 'sale',
          include: [
            {
              model: Location,
              as: 'location'
            },
            {
              model: Customer,
              as: 'customer'
            }
          ]
        },
        {
          model: Product,
          as: 'product'
        }
      ]
    });

    if (!saleItem) {
      throw new AppError(404, 'Sale item not found');
    }

    // Check if warranty already exists for this sale item
    const existingWarranty = await WarrantyCard.findOne({
      where: { saleItemId: saleItemId },
    });

    if (existingWarranty) {
      await existingWarranty.reload({
        include: [
          { model: Product, as: 'product' },
          { model: Customer, as: 'customer' },
          { model: Location, as: 'location' }
        ]
      });
      return existingWarranty.toJSON();
    }

    // Only create warranty if product has warranty months
    if (saleItem.warrantyMonths <= 0) {
      return null;
    }

    const warrantyNumber = await this.generateWarrantyNumber();
    const startDate = new Date();
    const expiryDate = this.calculateExpiryDate(startDate, saleItem.warrantyMonths);

    // Create warranty card
    const warrantyCard = await WarrantyCard.create({
      warrantyNumber,
      saleId: saleItem.saleId,
      saleItemId: saleItem.id,
      productId: saleItem.productId,
      productName: saleItem.product?.name || 'Unknown Product',
      productSku: saleItem.product?.sku || null,
      productCode: saleItem.product?.productCode || 'N/A',
      customerId: saleItem.sale.customerId || null,
      customerName: saleItem.sale.customer?.name || 'Walk-in Customer',
      customerPhone: saleItem.sale.customer?.phone || '',
      customerEmail: saleItem.sale.customer?.email || null,
      locationId: saleItem.sale.locationId,
      warrantyType: saleItem.product?.warrantyType || WarrantyType.STANDARD,
      warrantyMonths: saleItem.warrantyMonths,
      startDate,
      expiryDate,
      status: WarrantyStatus.ACTIVE,
      terms: (saleItem.product as any).terms || `This warranty covers manufacturing defects for ${saleItem.warrantyMonths} months from the date of purchase.`,
      coverage: (saleItem.product as any).coverage || 'Manufacturing defects, hardware failures, and software issues under normal use.',
      exclusions: (saleItem.product as any).exclusions || 'Physical damage, water damage, unauthorized repairs, misuse, and normal wear and tear.',
    });

    await warrantyCard.reload({
      include: [
        { model: Product, as: 'product' },
        { model: Customer, as: 'customer' },
        { model: Location, as: 'location' }
      ]
    });

    return warrantyCard.toJSON();
  }

  /**
   * Manually create warranty card (admin only)
   */
  async createWarrantyCard(data: CreateWarrantyCardDTO): Promise<any> {
    // Validate sale item exists
    const saleItem = await SaleItem.findByPk(data.saleItemId, {
      include: [
        {
          model: Sale,
          as: 'sale',
          include: [
            {
              model: Location,
              as: 'location'
            },
            {
              model: Customer,
              as: 'customer'
            }
          ]
        },
        {
          model: Product,
          as: 'product'
        }
      ]
    });

    if (!saleItem) {
      throw new AppError(404, 'Sale item not found');
    }

    // Check if sale belongs to the specified sale
    if (saleItem.saleId !== data.saleId) {
      throw new AppError(400, 'Sale item does not belong to specified sale');
    }

    // Check if warranty already exists
    const existingWarranty = await WarrantyCard.findOne({
      where: { saleItemId: data.saleItemId },
    });

    if (existingWarranty) {
      throw new AppError(409, 'Warranty card already exists for this sale item');
    }

    const warrantyNumber = await this.generateWarrantyNumber();
    const warrantyMonths = data.warrantyMonths || saleItem.warrantyMonths;
    const startDate = new Date();
    const expiryDate = this.calculateExpiryDate(startDate, warrantyMonths);

    const warrantyCard = await WarrantyCard.create({
      warrantyNumber,
      saleId: data.saleId,
      saleItemId: data.saleItemId,
      productId: saleItem.productId,
      productName: saleItem.product?.name || 'Unknown Product',
      productSku: saleItem.product?.sku || null,
      productCode: saleItem.product?.productCode || 'N/A',
      serialNumber: data.serialNumber || null,
      customerId: saleItem.sale.customerId || null,
      customerName: saleItem.sale.customer?.name || 'Walk-in Customer',
      customerPhone: saleItem.sale.customer?.phone || '',
      customerEmail: saleItem.sale.customer?.email || null,
      locationId: saleItem.sale.locationId,
      warrantyType: saleItem.product?.warrantyType || WarrantyType.STANDARD,
      warrantyMonths,
      startDate,
      expiryDate,
      status: WarrantyStatus.ACTIVE,
      terms: data.customTerms || (saleItem.product as any).terms || `This warranty covers manufacturing defects for ${warrantyMonths} months from the date of purchase.`,
      coverage: data.coverage || (saleItem.product as any).coverage || 'Manufacturing defects, hardware failures, and software issues under normal use.',
      exclusions: data.exclusions || (saleItem.product as any).exclusions || 'Physical damage, water damage, unauthorized repairs, misuse, and normal wear and tear.',
    });

    await warrantyCard.reload({
      include: [
        { model: Product, as: 'product' },
        { model: Customer, as: 'customer' },
        { model: Location, as: 'location' },
        { model: Sale, as: 'sale' }
      ]
    });

    return warrantyCard.toJSON();
  }

  /**
   * Get all warranty cards with filtering and pagination
   */
  async getWarrantyCards(query: QueryWarrantyCardsDTO): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      productId,
      customerId,
      locationId,
      startDate,
      endDate,
      isExpired,
      isExpiringSoon,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    const offset = (page - 1) * limit;
    const where: any = {};

    // Search by warranty number, customer name, or phone
    if (search) {
      where[Op.or] = [
        { warrantyNumber: { [Op.iLike]: `%${search}%` } },
        { customerName: { [Op.iLike]: `%${search}%` } },
        { customerPhone: { [Op.iLike]: `%${search}%` } },
        { serialNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (customerId) where.customerId = customerId;
    if (locationId) where.locationId = locationId;

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // Expired filter
    if (isExpired !== undefined) {
      if (isExpired) {
        where.expiryDate = { [Op.lt]: new Date() };
      } else {
        where.expiryDate = { [Op.gte]: new Date() };
      }
    }

    // Expiring soon filter (within 30 days)
    if (isExpiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.expiryDate = {
        [Op.gte]: new Date(),
        [Op.lte]: thirtyDaysFromNow,
      };
      where.status = WarrantyStatus.ACTIVE;
    }

    const { count: total, rows: warranties } = await WarrantyCard.findAndCountAll({
      where,
      offset,
      limit,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'product_code']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['name', 'phone']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['name', 'location_code']
        },
        {
          model: Sale,
          as: 'sale',
          attributes: ['sale_number', 'created_at']
        }
      ],
      distinct: true
    });

    // Get summary counts using raw query for groupBy
    const summaryWhere = locationId ? { location_id: locationId } : {};
    const summaryQuery = await sequelize.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM warranty_cards ${Object.keys(summaryWhere).length > 0 ? `WHERE location_id = :location_id` : ''} GROUP BY status`,
      {
        replacements: summaryWhere,
        type: QueryTypes.SELECT
      }
    );

    const summaryMap = {
      totalActive: 0,
      totalExpired: 0,
      totalClaimed: 0,
      totalVoided: 0,
    };

    summaryQuery.forEach((item) => {
      if (item.status === WarrantyStatus.ACTIVE) summaryMap.totalActive = parseInt(item.count);
      if (item.status === WarrantyStatus.EXPIRED) summaryMap.totalExpired = parseInt(item.count);
      if (item.status === WarrantyStatus.CLAIMED) summaryMap.totalClaimed = parseInt(item.count);
      if (item.status === WarrantyStatus.VOIDED) summaryMap.totalVoided = parseInt(item.count);
    });

    // Count expiring in 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringIn30DaysWhere: any = {
      status: WarrantyStatus.ACTIVE,
      expiryDate: { [Op.gte]: new Date(), [Op.lte]: thirtyDaysFromNow },
    };
    if (locationId) expiringIn30DaysWhere.locationId = locationId;
    const expiringIn30Days = await WarrantyCard.count({
      where: expiringIn30DaysWhere
    });

    return {
      warranties: warranties.map(w => w.toJSON()),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        ...summaryMap,
        expiringIn30Days,
      },
    };
  }

  /**
   * Get warranty card by ID
   */
  async getWarrantyCardById(id: string): Promise<any> {
    const warranty = await WarrantyCard.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product'
        },
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: Location,
          as: 'location'
        },
        {
          model: Sale,
          as: 'sale',
          include: [
            {
              model: User,
              as: 'soldBy',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: SaleItem,
          as: 'saleItem'
        },
        {
          model: WarrantyClaim,
          as: 'claims',
          order: [['created_at', 'DESC']],
          include: [
            {
              model: User,
              as: 'assignedTo',
              attributes: ['id', 'name']
            },
            {
              model: JobSheet,
              as: 'jobSheet',
              attributes: ['id', 'job_number', 'status']
            }
          ]
        }
      ]
    });

    if (!warranty) {
      throw new AppError(404, 'Warranty card not found');
    }

    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.ceil((warranty.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...warranty.toJSON(),
      daysRemaining,
      isExpired: daysRemaining < 0,
    };
  }

  /**
   * Search warranty by identifier (warranty number, phone, serial number)
   */
  async searchWarranty(identifier: string): Promise<any[]> {
    const warranties = await WarrantyCard.findAll({
      where: {
        [Op.or]: [
          { warrantyNumber: { [Op.iLike]: `%${identifier}%` } },
          { customerPhone: { [Op.like]: `%${identifier}%` } },
          { serialNumber: { [Op.iLike]: `%${identifier}%` } },
        ],
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'product_code']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['name', 'phone']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['name']
        },
        {
          model: WarrantyClaim,
          as: 'claims',
          where: {
            status: { [Op.notIn]: [ClaimStatus.COMPLETED, ClaimStatus.CANCELLED] }
          },
          required: false,
          attributes: ['id', 'claim_number', 'status']
        }
      ],
      limit: 10,
    });

    return warranties.map((warranty) => {
      const now = new Date();
      const daysRemaining = Math.ceil((warranty.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...warranty.toJSON(),
        daysRemaining,
        isExpired: daysRemaining < 0,
      };
    });
  }

  /**
   * Get customer warranties
   */
  async getCustomerWarranties(customerId: string): Promise<any> {
    const warranties = await WarrantyCard.findAll({
      where: { customerId: customerId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'product_code']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['name']
        },
        {
          model: WarrantyClaim,
          as: 'claims',
          attributes: ['id', 'claim_number', 'status']
        }
      ]
    });

    const warrantiesJSON = warranties.map(w => w.toJSON());
    const summary = {
      total: warrantiesJSON.length,
      active: warrantiesJSON.filter((w) => w.status === WarrantyStatus.ACTIVE).length,
      expired: warrantiesJSON.filter((w) => w.status === WarrantyStatus.EXPIRED).length,
      claimed: warrantiesJSON.filter((w) => w.status === WarrantyStatus.CLAIMED).length,
    };

    return { warranties: warrantiesJSON, summary };
  }

  /**
   * Transfer warranty to new owner
   */
  async transferWarranty(id: string, data: TransferWarrantyDTO): Promise<any> {
    const warranty = await WarrantyCard.findByPk(id);

    if (!warranty) {
      throw new AppError(404, 'Warranty card not found');
    }

    if (warranty.status === WarrantyStatus.VOIDED) {
      throw new AppError(400, 'Cannot transfer a voided warranty');
    }

    if (warranty.status === WarrantyStatus.EXPIRED) {
      throw new AppError(400, 'Cannot transfer an expired warranty');
    }

    await WarrantyCard.update({
      isTransferred: true,
      transferredTo: data.transferredTo,
      transferredPhone: data.transferredPhone,
      transferredDate: new Date(),
      transferNotes: data.transferNotes,
      status: WarrantyStatus.TRANSFERRED,
    }, {
      where: { id }
    });

    await warranty.reload({
      include: [
        { model: Product, as: 'product' },
        { model: Location, as: 'location' }
      ]
    });

    return warranty.toJSON();
  }

  /**
   * Void a warranty card
   */
  async voidWarranty(id: string, data: VoidWarrantyDTO): Promise<void> {
    const warranty = await WarrantyCard.findByPk(id);

    if (!warranty) {
      throw new AppError(404, 'Warranty card not found');
    }

    if (warranty.status === WarrantyStatus.VOIDED) {
      throw new AppError(400, 'Warranty is already voided');
    }

    await WarrantyCard.update({
      status: WarrantyStatus.VOIDED,
      voidedAt: new Date(),
      voidReason: data.reason,
    }, {
      where: { id }
    });
  }

  /**
   * Get expiring warranties
   */
  async getExpiringWarranties(days: number = 30, locationId?: string): Promise<any> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const where: any = {
      status: WarrantyStatus.ACTIVE,
      expiryDate: {
        [Op.gte]: new Date(),
        [Op.lte]: futureDate,
      },
    };
    if (locationId) where.locationId = locationId;

    const warranties = await WarrantyCard.findAll({
      where,
      order: [['expiry_date', 'ASC']],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'product_code']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['name', 'phone', 'email']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['name']
        }
      ]
    });

    return {
      warranties: warranties.map((w) => ({
        ...w.toJSON(),
        daysRemaining: Math.ceil((w.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      })),
      count: warranties.length,
    };
  }

  // ============================================
  // WARRANTY CLAIMS METHODS
  // ============================================

  /**
   * Create warranty claim
   */
  async createClaim(data: CreateWarrantyClaimDTO): Promise<any> {
    // Validate warranty card exists
    const warranty = await WarrantyCard.findByPk(data.warrantyCardId, {
      include: [
        {
          model: Product,
          as: 'product'
        },
        {
          model: Customer,
          as: 'customer'
        }
      ]
    });

    if (!warranty) {
      throw new AppError(404, 'Warranty card not found');
    }

    if (warranty.status === WarrantyStatus.VOIDED) {
      throw new AppError(400, 'Cannot create claim for voided warranty');
    }

    const claimNumber = await this.generateClaimNumber();

    const claim = await WarrantyClaim.create({
      claimNumber,
      warrantyCardId: data.warrantyCardId,
      issueDescription: data.issueDescription,
      issueType: data.issueType,
      priority: data.priority,
      images: data.images || [],
      documents: data.documents || [],
      locationId: data.locationId,
      submittedById: data.submittedById,
      estimatedCost: data.estimatedCost,
      actualCost: data.actualCost,
      customerCharge: data.customerCharge,
      status: ClaimStatus.SUBMITTED,
    });

    await claim.reload({
      include: [
        {
          model: WarrantyCard,
          as: 'warrantyCard',
          include: [
            {
              model: Product,
              as: 'product'
            },
            {
              model: Customer,
              as: 'customer'
            }
          ]
        },
        {
          model: Location,
          as: 'location'
        },
        {
          model: User,
          as: 'submittedBy',
          attributes: ['id', 'name']
        }
      ]
    });

    // Update warranty status to CLAIMED if it's ACTIVE
    if (warranty.status === WarrantyStatus.ACTIVE) {
      await WarrantyCard.update({
        status: WarrantyStatus.CLAIMED
      }, {
        where: { id: data.warrantyCardId }
      });
    }

    return claim.toJSON();
  }

  /**
   * Get all warranty claims with filtering
   */
  async getClaims(query: QueryWarrantyClaimsDTO): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      warrantyCardId,
      locationId,
      startDate,
      endDate,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    const offset = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where[Op.or] = [
        { claimNumber: { [Op.iLike]: `%${search}%` } },
        { issueType: { [Op.iLike]: `%${search}%` } },
      ];
      // Note: warrantyCard search needs a subquery or join
      const warrantyCards = await WarrantyCard.findAll({
        where: { warrantyNumber: { [Op.iLike]: `%${search}%` } },
        attributes: ['id']
      });
      if (warrantyCards.length > 0) {
        where[Op.or].push({ warrantyCardId: { [Op.in]: warrantyCards.map(wc => wc.id) } });
      }
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (warrantyCardId) where.warrantyCardId = warrantyCardId;
    if (locationId) where.locationId = locationId;

    if (startDate || endDate) {
      where.claimDate = {};
      if (startDate) where.claimDate[Op.gte] = new Date(startDate);
      if (endDate) where.claimDate[Op.lte] = new Date(endDate);
    }

    const [claims, total] = await Promise.all([
      WarrantyClaim.findAll({
        where,
        offset,
        limit,
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: [
          {
            model: WarrantyCard,
            as: 'warrantyCard',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['name']
              },
              {
                model: Customer,
                as: 'customer',
                attributes: ['name', 'phone']
              }
            ]
          },
          {
            model: Location,
            as: 'location',
            attributes: ['name']
          },
          {
            model: User,
            as: 'assignedTo',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'submittedBy',
            attributes: ['id', 'name']
          },
          {
            model: JobSheet,
            as: 'jobSheet',
            attributes: ['id', 'job_number', 'status']
          }
        ]
      }),
      WarrantyClaim.count({ where }),
    ]);

    // Get summary counts using groupBy
    const summaryWhere = locationId ? { location_id: locationId } : {};
    const summaryData = await WarrantyClaim.findAll({
      where: summaryWhere,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const summaryMap: any = {
      totalClaims: total,
      submitted: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
    };

    summaryData.forEach((item: any) => {
      const status = item.status as ClaimStatus;
      const count = parseInt(item.count as string);
      if (status === ClaimStatus.SUBMITTED) summaryMap.submitted = count;
      if (status === ClaimStatus.UNDER_REVIEW) summaryMap.underReview = count;
      if (status === ClaimStatus.APPROVED) summaryMap.approved = count;
      if (status === ClaimStatus.REJECTED) summaryMap.rejected = count;
      if (status === ClaimStatus.COMPLETED) summaryMap.completed = count;
    });

    return {
      claims: claims.map(c => c.toJSON()),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: summaryMap,
    };
  }

  /**
   * Get claim by ID
   */
  async getClaimById(id: string): Promise<any> {
    const claim = await WarrantyClaim.findByPk(id, {
      include: [
        {
          model: WarrantyCard,
          as: 'warrantyCard',
          include: [
            {
              model: Product,
              as: 'product'
            },
            {
              model: Customer,
              as: 'customer'
            },
            {
              model: Sale,
              as: 'sale',
              attributes: ['sale_number', 'created_at']
            }
          ]
        },
        {
          model: Location,
          as: 'location'
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'submittedBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: JobSheet,
          as: 'jobSheet',
          attributes: ['status'],
          include: [
            {
              model: User,
              as: 'assignedTo',
              attributes: ['name']
            }
          ]
        },
        {
          model: Product,
          as: 'replacementProduct',
          attributes: ['id', 'name', 'product_code']
        }
      ]
    });

    if (!claim) {
      throw new AppError(404, 'Warranty claim not found');
    }

    return claim.toJSON();
  }

  /**
   * Update claim status
   */
  async updateClaimStatus(id: string, data: UpdateClaimStatLKRTO): Promise<any> {
    const claim = await WarrantyClaim.findByPk(id);

    if (!claim) {
      throw new AppError(404, 'Claim not found');
    }

    const notes = data.notes ? `${claim.notes || ''}\n${new Date().toISOString()}: ${data.notes}` : claim.notes;

    await WarrantyClaim.update({
      status: data.status,
      notes,
      assignedToId: data.assignedToId || claim.assignedToId,
    }, {
      where: { id }
    });

    const updated = await WarrantyClaim.findByPk(id, {
      include: [
        {
          model: WarrantyCard,
          as: 'warrantyCard'
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['name']
        }
      ]
    });

    return updated?.toJSON();
  }

  /**
   * Resolve warranty claim
   */
  async resolveClaim(id: string, data: ResolveClaimDTO): Promise<any> {
    const claim = await WarrantyClaim.findByPk(id, {
      include: [
        {
          model: WarrantyCard,
          as: 'warrantyCard'
        }
      ]
    });

    if (!claim) {
      throw new AppError(404, 'Claim not found');
    }

    if (claim.status === ClaimStatus.COMPLETED) {
      throw new AppError(400, 'Claim is already completed');
    }

    await WarrantyClaim.update({
      status: ClaimStatus.COMPLETED,
      resolutionType: data.resolutionType,
      resolutionNotes: data.resolutionNotes,
      resolutionDate: new Date(),
      jobSheetId: data.jobSheetId,
      replacementProductId: data.replacementProductId,
      actualCost: data.actualCost,
      customerCharge: data.customerCharge,
    }, {
      where: { id }
    });

    const updated = await WarrantyClaim.findByPk(id, {
      include: [
        {
          model: WarrantyCard,
          as: 'warrantyCard'
        },
        {
          model: JobSheet,
          as: 'jobSheet',
          attributes: ['job_number']
        },
        {
          model: Product,
          as: 'replacementProduct',
          attributes: ['name', 'product_code']
        }
      ]
    });

    return updated?.toJSON();
  }

  /**
   * Assign claim to staff
   */
  async assignClaim(id: string, data: AssignClaimDTO): Promise<void> {
    const claim = await WarrantyClaim.findByPk(id);

    if (!claim) {
      throw new AppError(404, 'Claim not found');
    }

    await WarrantyClaim.update({
      assignedToId: data.assignedToId,
      status: claim.status === ClaimStatus.SUBMITTED ? ClaimStatus.UNDER_REVIEW : claim.status,
    }, {
      where: { id }
    });
  }

  /**
   * Get warranty analytics
   */
  async getAnalytics(query: WarrantyAnalyticsQueryDTO): Promise<WarrantyAnalyticsDTO> {
    const { startDate, endDate, locationId } = query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }
    if (locationId) where.locationId = locationId;

    // Get warranty counts by status
    const warrantyCounts = await WarrantyCard.findAll({
      where,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const analytics: any = {
      totalWarranties: 0,
      activeWarranties: 0,
      expiredWarranties: 0,
      claimedWarranties: 0,
      voidedWarranties: 0,
    };

    warrantyCounts.forEach((item: any) => {
      const count = parseInt(item.count as string);
      analytics.totalWarranties += count;
      if (item.status === WarrantyStatus.ACTIVE) analytics.activeWarranties = count;
      if (item.status === WarrantyStatus.EXPIRED) analytics.expiredWarranties = count;
      if (item.status === WarrantyStatus.CLAIMED) analytics.claimedWarranties = count;
      if (item.status === WarrantyStatus.VOIDED) analytics.voidedWarranties = count;
    });

    // Get claim statistics
    const claimWhere: any = locationId ? { locationId: locationId } : {};
    const totalClaims = await WarrantyClaim.count({ where: claimWhere });
    const approvedClaims = await WarrantyClaim.count({
      where: {
        ...claimWhere,
        status: { [Op.in]: [ClaimStatus.APPROVED, ClaimStatus.COMPLETED] }
      }
    });

    analytics.totalClaims = totalClaims;
    analytics.claimRate = analytics.totalWarranties > 0 ? (totalClaims / analytics.totalWarranties) * 100 : 0;
    analytics.approvalRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0;

    // Average claim resolution days
    const completedClaims = await WarrantyClaim.findAll({
      where: {
        ...claimWhere,
        status: ClaimStatus.COMPLETED,
        resolutionDate: { [Op.ne]: null }
      },
      attributes: ['claimDate', 'resolutionDate']
    });

    if (completedClaims.length > 0) {
      const totalDays = completedClaims.reduce((sum, claim) => {
        const days = Math.ceil(
          (claim.resolutionDate!.getTime() - claim.claimDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      analytics.averageClaimResolutionDays = Math.round(totalDays / completedClaims.length);
    } else {
      analytics.averageClaimResolutionDays = 0;
    }

    // Top claimed products - using raw query for complex groupBy with ordering
    const topClaimedProducts = await sequelize.query(`
      SELECT "warranty_card_id", COUNT(*) as count
      FROM warranty_claims
      ${locationId ? `WHERE "location_id" = :location_id` : ''}
      GROUP BY "warranty_card_id"
      ORDER BY count DESC
      LIMIT 5
    `, {
      replacements: locationId ? { location_id: locationId } : {},
      type: QueryTypes.SELECT
    }) as Array<{ warranty_card_id: string; count: number }>;

    const warrantyCardIds = topClaimedProducts.map(p => p.warranty_card_id);
    const warrantyCards = await WarrantyCard.findAll({
      where: { id: { [Op.in]: warrantyCardIds } },
      attributes: ['id', 'product_id', 'product_name']
    });

    analytics.topClaimedProducts = topClaimedProducts.map((item) => {
      const warrantyCard = warrantyCards.find(wc => wc.id === item.warranty_card_id);
      return {
        productId: warrantyCard?.productId || '',
        productName: warrantyCard?.productName || 'Unknown',
        claimCount: parseInt(item.count as unknown as string),
      };
    });

    // Claims by type
    const claimsByType = await WarrantyClaim.findAll({
      where: claimWhere,
      attributes: [
        'issue_type',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['issue_type'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    analytics.claimsByType = claimsByType.map((item: any) => ({
      issueType: item.issueType,
      count: parseInt(item.count as string),
    }));

    // Monthly trends (last 6 months) - using raw query for date grouping
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const warrantyTrendsQuery = `
      SELECT DATE_TRUNC('month', "created_at") as month, COUNT(*) as count
      FROM warranty_cards
      WHERE "created_at" >= :sixMonthsAgo
      ${locationId ? `AND "location_id" = :location_id` : ''}
      ${startDate ? `AND "created_at" >= :start_date` : ''}
      ${endDate ? `AND "created_at" <= :end_date` : ''}
      GROUP BY DATE_TRUNC('month', "created_at")
      ORDER BY month ASC
    `;

    const claimTrendsQuery = `
      SELECT DATE_TRUNC('month', "claim_date") as month, COUNT(*) as count
      FROM warranty_claims
      WHERE "claim_date" >= :sixMonthsAgo
      ${locationId ? `AND "location_id" = :location_id` : ''}
      GROUP BY DATE_TRUNC('month', "claim_date")
      ORDER BY month ASC
    `;

    const replacements: any = { sixMonthsAgo };
    if (locationId) replacements.location_id = locationId;
    if (startDate) replacements.start_date = startDate;
    if (endDate) replacements.end_date = endDate;

    const [warrantyTrends, claimTrends] = await Promise.all([
      sequelize.query(warrantyTrendsQuery, {
        replacements,
        type: QueryTypes.SELECT
      }) as Promise<Array<{ month: Date; count: number }>>,
      sequelize.query(claimTrendsQuery, {
        replacements,
        type: QueryTypes.SELECT
      }) as Promise<Array<{ month: Date; count: number }>>
    ]);

    // Group by month
    const monthlyData: any = {};
    warrantyTrends.forEach((item) => {
      const month = new Date(item.month).toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { warrantiesIssued: 0, claimsReceived: 0 };
      monthlyData[month].warrantiesIssued += parseInt(item.count as unknown as string);
    });

    claimTrends.forEach((item) => {
      const month = new Date(item.month).toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { warrantiesIssued: 0, claimsReceived: 0 };
      monthlyData[month].claimsReceived += parseInt(item.count as unknown as string);
    });

    analytics.monthlyTrends = Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
      month,
      warrantiesIssued: data.warrantiesIssued,
      claimsReceived: data.claimsReceived,
    }));

    return analytics;
  }

  /**
   * Get product warranty analytics
   */
  async getProductAnalytics(productId: string): Promise<any> {
    const warranties = await WarrantyCard.findAll({
      where: { productId: productId }
    });

    // Get warranty card IDs for this product
    const warrantyCardIds = warranties.map(w => w.id);
    
    const claims = await WarrantyClaim.findAll({
      where: { warrantyCardId: { [Op.in]: warrantyCardIds } },
      include: [
        {
          model: WarrantyCard,
          as: 'warrantyCard'
        }
      ]
    });

    const product = await Product.findByPk(productId, {
      attributes: ['name', 'product_code', 'warranty_months']
    });

    const claimRate = warranties.length > 0 ? (claims.length / warranties.length) * 100 : 0;

    // Get common issues
    const issueTypes = claims.reduce((acc: any, claim) => {
      acc[claim.issueType] = (acc[claim.issueType] || 0) + 1;
      return acc;
    }, {});

    const commonIssues = Object.entries(issueTypes)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(([type]) => type);

    return {
      product: product?.toJSON(),
      totalWarranties: warranties.length,
      activeWarranties: warranties.filter((w) => w.status === WarrantyStatus.ACTIVE).length,
      totalClaims: claims.length,
      claimRate: Math.round(claimRate * 100) / 100,
      commonIssues,
    };
  }

  /**
   * Download warranty card as PDF
   */
  async downloadWarrantyCard(warrantyId: string, options: DownloadWarrantyCardDTO): Promise<Buffer> {
    const warranty = await WarrantyCard.findByPk(warrantyId, {
      include: [
        {
          model: SaleItem,
          as: 'saleItem',
          include: [
            {
              model: Product,
              as: 'product'
            },
            {
              model: Sale,
              as: 'sale',
              include: [
                {
                  model: Customer,
                  as: 'customer'
                },
                {
                  model: Location,
                  as: 'location'
                }
              ]
            }
          ]
        }
      ]
    });

    if (!warranty) {
      throw new AppError(404, 'Warranty card not found');
    }

    return this.generateWarrantyCardPDF(warranty.toJSON(), options);
  }

  /**
   * Print warranty card (returns PDF buffer for printing)
   */
  async printWarrantyCard(warrantyId: string, options: PrintWarrantyCardDTO): Promise<Buffer> {
    const warranty = await WarrantyCard.findByPk(warrantyId, {
      include: [
        {
          model: SaleItem,
          as: 'saleItem',
          include: [
            {
              model: Product,
              as: 'product'
            },
            {
              model: Sale,
              as: 'sale',
              include: [
                {
                  model: Customer,
                  as: 'customer'
                },
                {
                  model: Location,
                  as: 'location'
                }
              ]
            }
          ]
        }
      ]
    });

    if (!warranty) {
      throw new AppError(404, 'Warranty card not found');
    }

    return this.generateWarrantyCardPDF(warranty.toJSON(), options);
  }

 /**
 * Generate PDF warranty card - FIXED VERSION
 */
private async generateWarrantyCardPDF(
  warranty: any, 
  options: DownloadWarrantyCardDTO | PrintWarrantyCardDTO
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const businessService = new BusinessService();
      const businessData = await businessService.getBusinessProfile();
      
      console.log('Business data for warranty card:', businessData);

      // Extract business information with fallbacks
      const businessName = businessData?.name?.trim() || 'GadgetChain Manager';
      const address = businessData?.address?.trim() || 'No.43, High Level Road, Kirullapone, Colombo 06.';
      const phone = businessData?.telephone?.trim() || '0769781811';
      const email = businessData?.email?.trim() || 'info@lankatechsolutions.lk';

      console.log('Business info:', { businessName, address, phone, email });

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Extract customer and product data with fallbacks
      const customerName = warranty.customerName || warranty.saleItem?.sale?.customer?.name || 'N/A';
      const customerPhone = warranty.customerPhone || warranty.saleItem?.sale?.customer?.phone || 'N/A';
      const customerEmail = warranty.customerEmail || warranty.saleItem?.sale?.customer?.email || '';
      const productName = warranty.productName || warranty.saleItem?.product?.name || 'N/A';
      const saleDate = warranty.saleItem?.sale?.saleDate || warranty.startDate || new Date();

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const CLOUDINARY_BASE_URL = process.env.CLOUDINARY_BASE_URL || 'https://res.cloudinary.com';

      // ===== HEADER SECTION WITH BUSINESS INFO =====
      doc.rect(0, 0, pageWidth, 140).fill('#1e40af');
      
      // Logo on the RIGHT side
      const logoToUse = businessData?.logo || '/image/upload/v1766231611/business/logos/default-logo.png'; // Use default logo if none set
      
      try {
        const logoUrl = `${CLOUDINARY_BASE_URL}${logoToUse}`;
        console.log('Loading logo from URL:', logoUrl);
        const res = await axios.get(logoUrl, { responseType: 'arraybuffer' });
        doc.image(Buffer.from(res.data), pageWidth - 120, 25, { width: 90, height: 70 });
        console.log('Logo loaded successfully');
      } catch (err) {
        console.error('Error loading logo:', err);
        // Fallback to text placeholder
        doc.fillColor('#ffffff')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('LOGO', pageWidth - 120, 45, { width: 90, align: 'center' });
      }

      // Left side text - business information
      doc.fillColor('white');

      doc.fontSize(28)
        .font('Helvetica-Bold')
        .text('WARRANTY CARD', 50, 25);
      
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text(businessName, 50, 55);

      let contactY = 75;
      doc.fontSize(10).font('Helvetica');

      // Business name
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text(businessName, 50, 55);

      // Reset font for contact info
      doc.fontSize(10).font('Helvetica');

      // Address
      doc.text(`Address: ${address}`, 50, contactY, {
        width: pageWidth - 200,
        lineBreak: true
      });
      contactY += doc.heightOfString(`Address: ${address}`, { width: pageWidth - 200 }) + 8;

      // Telephone
      doc.text(`Tel: ${phone}`, 50, contactY, { width: pageWidth - 200 });
      contactY += 15;

      // Email
      doc.text(`Email: ${email}`, 50, contactY, { width: pageWidth - 200 });

      // Reset position after header
      doc.y = 160;

      // ===== WARRANTY NUMBER BOX (FIXED) =====
      const warrantyBoxY = doc.y;
      const warrantyBoxHeight = 50;
      
      // Draw white box with border
      doc.rect(50, warrantyBoxY, pageWidth - 100, warrantyBoxHeight)
        .fillAndStroke('#ffffff', '#1e40af');
      
      // Add warranty number text
      doc.fillColor('#1e40af')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(
          `Warranty Number: ${warranty.warrantyNumber}`,
          50,
          warrantyBoxY + 15,
          { width: pageWidth - 100, align: 'center' }
        );

      // Move down after warranty box
      doc.y = warrantyBoxY + warrantyBoxHeight + 20;

      // ===== CUSTOMER INFORMATION SECTION =====
      const customerSectionY = doc.y;
      const customerSectionHeight = 80;
      
      doc.rect(50, customerSectionY, pageWidth - 100, customerSectionHeight)
        .fillAndStroke('#f3f4f6', '#d1d5db');
      
      doc.fillColor('#1e40af')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('CUSTOMER INFORMATION', 60, customerSectionY + 10);
      
      doc.fillColor('#000000')
        .fontSize(10)
        .font('Helvetica')
        .text(`Name: ${customerName}`, 60, customerSectionY + 30)
        .text(`Phone: ${customerPhone}`, 60, customerSectionY + 45);
      
      if (customerEmail) {
        doc.text(`Email: ${customerEmail}`, 60, customerSectionY + 60);
      }

      doc.y = customerSectionY + customerSectionHeight + 20;

      // ===== PRODUCT INFORMATION SECTION =====
      const productSectionY = doc.y;
      const productSectionHeight = 120;
      
      doc.rect(50, productSectionY, pageWidth - 100, productSectionHeight)
        .fillAndStroke('#ffffff', '#d1d5db');
      
      doc.fillColor('#1e40af')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('PRODUCT INFORMATION', 60, productSectionY + 10);
      
      // Left column
      doc.fillColor('#000000')
        .fontSize(10)
        .font('Helvetica')
        .text(`Product: ${productName}`, 60, productSectionY + 35)
        .text(`Product Code: ${warranty.productCode || 'N/A'}`, 60, productSectionY + 50)
        .text(`SKU: ${warranty.productSku || 'N/A'}`, 60, productSectionY + 65)
        .text(`Serial Number: ${warranty.serialNumber || 'N/A'}`, 60, productSectionY + 80);
      
      // Right column
      const rightColX = pageWidth / 2 + 20;
      doc.text(`Purchase Date: ${new Date(saleDate).toLocaleDateString()}`, rightColX, productSectionY + 35)
        .text(`Warranty Period: ${warranty.warrantyMonths} months`, rightColX, productSectionY + 50)
        .text(`Start Date: ${new Date(warranty.startDate).toLocaleDateString()}`, rightColX, productSectionY + 65)
        .text(`Expiry Date: ${new Date(warranty.expiryDate).toLocaleDateString()}`, rightColX, productSectionY + 80);

      doc.y = productSectionY + productSectionHeight + 20;

      // ===== WARRANTY DETAILS SECTION =====
      const detailsSectionY = doc.y;
      const detailsSectionHeight = 60;
      
      doc.rect(50, detailsSectionY, pageWidth - 100, detailsSectionHeight)
        .fillAndStroke('#f9fafb', '#d1d5db');
      
      doc.fillColor('#1e40af')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('WARRANTY DETAILS', 60, detailsSectionY + 10);
      
      doc.fillColor('#000000')
        .fontSize(10)
        .font('Helvetica')
        .text(`Status: ${warranty.status}`, 60, detailsSectionY + 30)
        .text(`Warranty Type: ${warranty.warrantyType}`, 60, detailsSectionY + 45);
      
      if (warranty.coverage) {
        doc.text(`Coverage: ${warranty.coverage}`, rightColX, detailsSectionY + 30, {
          width: pageWidth / 2 - 80
        });
      }

      doc.y = detailsSectionY + detailsSectionHeight + 20;

      // ===== TERMS AND CONDITIONS =====
      if (options.includeTerms) {
        doc.fillColor('#1e40af')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('TERMS AND CONDITIONS', 50);
        
        doc.fillColor('#000000')
          .fontSize(9)
          .font('Helvetica')
          .text(
            warranty.terms || 'This warranty covers manufacturing defects and hardware failures under normal use conditions.',
            50,
            doc.y + 5,
            { width: pageWidth - 100 }
          );
        
        doc.moveDown();
      }

      // ===== EXCLUSIONS =====
      if (options.includeConditions && warranty.exclusions) {
        doc.fillColor('#1e40af')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('EXCLUSIONS', 50);
        
        doc.fillColor('#000000')
          .fontSize(9)
          .font('Helvetica')
          .text(warranty.exclusions, 50, doc.y + 5, { width: pageWidth - 100 });
        
        doc.moveDown();
      }

      // ===== FOOTER =====
      const footerY = pageHeight - 100;
      
      doc.moveTo(50, footerY)
        .lineTo(pageWidth - 50, footerY)
        .stroke('#1e40af');
      
      // Format date as requested: 12/21/2025, 3:34:00 PM
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      doc.fillColor('#666666')
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Generated on ${formattedDate}, ${formattedTime} | GadgetChain Manager`,
          50,
          footerY + 10,
          { align: 'center', width: pageWidth - 100 }
        )
        .text(
          'Powered by Divenzainc.com',
          50,
          footerY + 25,
          { align: 'center', width: pageWidth - 100 }
        );

      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });

}}

