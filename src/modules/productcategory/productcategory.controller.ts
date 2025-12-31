import { Request, Response } from 'express';
import { ProductCategoryService } from './productcategory.service';
import {
  createProductCategorySchema,
  updateProductCategorySchema,
  queryProductCategoriesSchema,
} from './productcategory.dto';
import { ZodError } from 'zod';

import { handlePrismaError } from '../../shared/utils/sequelize-error-handler';
import { AppError } from '../../shared/utils/app-error';
import { 
  UniqueConstraintError, 
  ForeignKeyConstraintError, 
  ValidationError, 
  DatabaseError,
  ConnectionError,
  TimeoutError 
} from 'sequelize';

const service = new ProductCategoryService();

export class ProductCategoryController {
  // Create category
  async create(req: Request, res: Response) {
    try {
      const validatedData = createProductCategorySchema.parse(req.body);
      const category = await service.createCategory(validatedData);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues,
        });
      }

      // Handle Sequelize errors
      if (error instanceof UniqueConstraintError || 
          error instanceof ForeignKeyConstraintError ||
          error instanceof ValidationError ||
          error instanceof DatabaseError ||
          error instanceof ConnectionError ||
          error instanceof TimeoutError) {
        try {
          handlePrismaError(error, 'Category');
        } catch (sequelizeError) {
          if (sequelizeError instanceof AppError) {
            return res.status(sequelizeError.statusCode).json({
              success: false,
              message: sequelizeError.message,
            });
          }
        }
      }

      // Handle AppError
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create category',
      });
    }
  }

  // Get all categories
  async getAll(req: Request, res: Response) {
    try {
      const query = queryProductCategoriesSchema.parse(req.query);
      const result = await service.getCategories(query);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
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
          handlePrismaError(error, 'Category');
        } catch (prismaError) {
          if (prismaError instanceof AppError) {
            return res.status(prismaError.statusCode).json({
              success: false,
              message: prismaError.message,
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
        message: error instanceof Error ? error.message : 'Failed to fetch categories',
      });
    }
  }

  // Get category tree
  async getTree(req: Request, res: Response) {
    try {
      const tree = await service.getCategoryTree();

      res.status(200).json({
        success: true,
        data: tree,
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError || 
          error instanceof ForeignKeyConstraintError ||
          error instanceof ValidationError ||
          error instanceof DatabaseError) {
        try {
          handlePrismaError(error, 'Category');
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
        message: error instanceof Error ? error.message : 'Failed to fetch category tree',
      });
    }
  }

  // Get category by ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await service.getCategoryById(id);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError || 
          error instanceof ForeignKeyConstraintError ||
          error instanceof ValidationError ||
          error instanceof DatabaseError) {
        try {
          handlePrismaError(error, 'Category');
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

      res.status(error instanceof Error && error.message === 'Category not found' ? 404 : 500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch category',
      });
    }
  }

  // Update category
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateProductCategorySchema.parse(req.body);
      const category = await service.updateCategory(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues,
        });
      }

      // Handle Sequelize errors
      if (error instanceof UniqueConstraintError || 
          error instanceof ForeignKeyConstraintError ||
          error instanceof ValidationError ||
          error instanceof DatabaseError) {
        try {
          handlePrismaError(error, 'Category');
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

      res.status(error instanceof Error && error.message === 'Category not found' ? 404 : 500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update category',
      });
    }
  }

  // Delete category
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await service.deleteCategory(id);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      // Handle Sequelize errors
      if (error instanceof UniqueConstraintError || 
          error instanceof ForeignKeyConstraintError ||
          error instanceof ValidationError ||
          error instanceof DatabaseError) {
        try {
          handlePrismaError(error, 'Category');
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

      res.status(error instanceof Error && error.message === 'Category not found' ? 404 : 500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete category',
      });
    }
  }

  // Get statistics
  async getStats(req: Request, res: Response) {
    try {
      const stats = await service.getCategoryStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError || 
          error instanceof ForeignKeyConstraintError ||
          error instanceof ValidationError ||
          error instanceof DatabaseError) {
        try {
          handlePrismaError(error, 'Category');
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
        message: error instanceof Error ? error.message : 'Failed to fetch statistics',
      });
    }
  }

  // Bulk upload categories
  async bulkUpload(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const result = await service.bulkUploadCategories(req.file);

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload categories',
      });
    }
  }
}

