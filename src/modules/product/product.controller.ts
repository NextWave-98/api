import { Request, Response } from 'express';
import { ProductService } from './product.service';
import {
  createProductSchema,
  updateProductSchema,
  queryProductsSchema,
  bulkPriceUpdateSchema,
  transferProductSchema,
  bulkTransferProductSchema,
  adjustProductStockSchema,
  bulkUploadProductsSchema,
} from './product.dto';
import { ZodError } from 'zod';

import { handlePrismaError } from '../../shared/utils/sequelize-error-handler';
import { AppError } from '../../shared/utils/app-error';
import { 
  UniqueConstraintError, 
  ForeignKeyConstraintError, 
  ValidationError, 
  DatabaseError 
} from 'sequelize';

const service = new ProductService();

export class ProductController {
  // Helper method to handle errors consistently
  private handleError(error: unknown, res: Response, defaultMessage: string) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    if (error instanceof UniqueConstraintError || 
        error instanceof ForeignKeyConstraintError ||
        error instanceof ValidationError ||
        error instanceof DatabaseError) {
      try {
        handlePrismaError(error, 'Product');
      } catch (sequelizeError) {
        if (sequelizeError instanceof AppError) {
          return res.status(sequelizeError.statusCode).json({
            success: false,
            message: sequelizeError.message,
          });
        }
      }
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : defaultMessage,
    });
  }

  // Create product
  async create(req: Request, res: Response) {
    try {
      const validatedData = createProductSchema.parse(req.body);
      const product = await service.createProduct(validatedData);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to create product');
    }
  }

  // Get all products
  async getAll(req: Request, res: Response) {
    try {
      const query = queryProductsSchema.parse(req.query);
      const result = await service.getProducts(query);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch products');
    }
  }

  // Get product by ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await service.getProductById(id);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch product');
    }
  }

  // Update product
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateProductSchema.parse(req.body);
      const product = await service.updateProduct(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues,
        });
      }
      this.handleError(error, res, 'Failed to update product');
    }
  }

  // Delete product
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await service.deleteProduct(id);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to delete product');
    }
  }

  // Bulk price update
  async bulkPriceUpdate(req: Request, res: Response) {
    try {
      const validatedData = bulkPriceUpdateSchema.parse(req.body);
      const result = await service.bulkPriceUpdate(validatedData);

      res.status(200).json({
        success: true,
        message: `${result.updated} products updated successfully`,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to update prices');
    }
  }

  // Get low stock products
  async getLowStock(req: Request, res: Response) {
    try {
      const { locationId } = req.query;
      const products = await service.getLowStockProducts(locationId as string);

      res.status(200).json({
        success: true,
        data: products,
        count: products.length,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch low stock products');
    }
  }

  // Get statistics
  async getStats(req: Request, res: Response) {
    try {
      const stats = await service.getProductStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch statistics');
    }
  }

  // Transfer product between branches
  async transferProduct(req: Request, res: Response) {
    try {
      const validatedData = transferProductSchema.parse({ body: req.body });
      const result = await service.transferProduct(validatedData.body);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.transfer,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to transfer product');
    }
  }

  // Bulk transfer products
  async bulkTransferProducts(req: Request, res: Response) {
    try {
      const validatedData = bulkTransferProductSchema.parse({ body: req.body });
      const result = await service.bulkTransferProducts(validatedData.body);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          from: result.from,
          to: result.to,
          items: result.items,
          totalItems: result.items.length,
        },
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to transfer products');
    }
  }

  // Adjust product stock
  async adjustStock(req: Request, res: Response) {
    try {
      const validatedData = adjustProductStockSchema.parse({ body: req.body });
      const result = await service.adjustProductStock(validatedData.body);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          product: result.product,
          location: result.location,
          adjustment: result.adjustment,
          newQuantity: result.newQuantity,
        },
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to adjust stock');
    }
  }

  // Get stock movements
  async getStockMovements(req: Request, res: Response) {
    try {
      const { productId, locationId, limit } = req.query;
      const movements = await service.getProductStockMovements(
        productId as string,
        locationId as string,
        limit ? parseInt(limit as string) : 100
      );

      res.status(200).json({
        success: true,
        data: movements,
        count: movements.length,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch stock movements');
    }
  }

  // Bulk upload products
  async bulkUpload(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const result = await service.bulkUploadProducts(req.file);

      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, 'Failed to upload products');
    }
  }
}

