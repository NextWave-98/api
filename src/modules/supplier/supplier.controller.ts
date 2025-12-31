import { Request, Response } from 'express';
import { SupplierService } from './supplier.service';
import {
  createSupplierSchema,
  updateSupplierSchema,
  querySuppliersSchema,
  addSupplierProductSchema,
  updateSupplierProductSchema,
} from './supplier.dto';
import { ZodError } from 'zod';
import { UniqueConstraintError, ForeignKeyConstraintError, ValidationError, DatabaseError } from 'sequelize';

import { handlePrismaError } from '../../shared/utils/sequelize-error-handler';
import { AppError } from '../../shared/utils/app-error';

const service = new SupplierService();

export class SupplierController {
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
        handlePrismaError(error, 'Supplier');
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

  // Create supplier
  async create(req: Request, res: Response) {
    try {
      console.log('=== Supplier Creation Debug ===');
      console.log('Raw request body:', JSON.stringify(req.body, null, 2));
      
      const validatedData = createSupplierSchema.parse(req.body);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));
      
      const supplier = await service.createSupplier(validatedData);

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier,
      });
    } catch (error) {
      console.error('=== Supplier Creation Error ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : error);
      if (error instanceof ZodError) {
        console.error('Zod validation errors:', JSON.stringify(error.issues, null, 2));
      }
      if ((error as any).original) {
        console.error('Database error details:', (error as any).original);
      }
      if ((error as any).sql) {
        console.error('SQL query:', (error as any).sql);
      }
      if ((error as any).parameters) {
        console.error('SQL parameters:', (error as any).parameters);
      }
      this.handleError(error, res, 'Failed to create supplier');
    }
  }

  // Get all suppliers
  async getAll(req: Request, res: Response) {
    try {
      const query = querySuppliersSchema.parse(req.query);
      const result = await service.getSuppliers(query);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch suppliers');
    }
  }

  // Get supplier by ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const supplier = await service.getSupplierById(id);

      res.status(200).json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch supplier');
    }
  }

  // Update supplier
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateSupplierSchema.parse(req.body);
      const supplier = await service.updateSupplier(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'Supplier updated successfully',
        data: supplier,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
           errors: error.issues,
        });
      }
      this.handleError(error, res, 'Failed to update supplier');
    }
  }

  // Delete supplier
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await service.deleteSupplier(id);

      res.status(200).json({
        success: true,
        message: 'Supplier deleted successfully',
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to delete supplier');
    }
  }

  // Add product to supplier
  async addProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = addSupplierProductSchema.parse(req.body);
      const supplierProduct = await service.addSupplierProduct(id, validatedData);

      res.status(201).json({
        success: true,
        message: 'Product added to supplier successfully',
        data: supplierProduct,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to add product to supplier');
    }
  }

  // Update supplier product
  async updateProduct(req: Request, res: Response) {
    try {
      const { id, productId } = req.params;
      const validatedData = updateSupplierProductSchema.parse(req.body);
      const supplierProduct = await service.updateSupplierProduct(id, productId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Supplier product updated successfully',
        data: supplierProduct,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to update supplier product');
    }
  }

  // Remove product from supplier
  async removeProduct(req: Request, res: Response) {
    try {
      const { id, productId } = req.params;
      await service.removeSupplierProduct(id, productId);

      res.status(200).json({
        success: true,
        message: 'Product removed from supplier successfully',
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to remove product from supplier');
    }
  }

  // Get supplier products
  async getProducts(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const products = await service.getSupplierProducts(id);

      res.status(200).json({
        success: true,
        data: products,
        count: products.length,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch supplier products');
    }
  }

  // Get statistics
  async getStats(req: Request, res: Response) {
    try {
      const stats = await service.getSupplierStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch statistics');
    }
  }

  // Get supplier performance
  async getPerformance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const performance = await service.getSupplierPerformance(id);

      res.status(200).json({
        success: true,
        data: performance,
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch supplier performance');
    }
  }
}

