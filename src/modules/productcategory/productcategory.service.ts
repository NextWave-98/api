import { AppError } from '../../shared/utils/app-error';
import { withPrismaErrorHandling } from '../../shared/utils/sequelize-error-handler';
import { CreateProductCategoryDto, UpdateProductCategoryDto, QueryProductCategoriesDto } from './productcategory.dto';
import { ProductCategory } from '../../models';
import { Op } from 'sequelize';
import * as ExcelJS from 'exceljs';

export class ProductCategoryService {
  // Generate unique category code
  async generateCategoryCode(): Promise<string> {
    const lastCategory = await ProductCategory.findOne({
      order: [['categoryCode', 'DESC']],
      attributes: ['categoryCode'],
    });

    if (!lastCategory) {
      return 'CAT-001';
    }

    const lastNumber = parseInt(lastCategory.categoryCode.split('-')[1]);
    const newNumber = lastNumber + 1;
    return `CAT-${newNumber.toString().padStart(3, '0')}`;
  }

  // Create category
  async createCategory(data: CreateProductCategoryDto) {
    // Check if category name already exists
    const existingCategory = await ProductCategory.findOne({
      where: { name: data.name },
    });
    
    if (existingCategory) {
      throw new Error(`Category with name "${data.name}" already exists`);
    }

    const categoryCode = await this.generateCategoryCode();

    // Validate parent exists if provided
    if (data.parentId) {
      const parent = await ProductCategory.findByPk(data.parentId);
      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    // Extract subcategories from data
    const { subcategories, ...categoryData } = data;

    // Create parent category
    const category = await ProductCategory.create({
      ...categoryData,
      categoryCode,
    });

    // Create subcategories if provided
    if (subcategories && subcategories.length > 0) {
      // Validate subcategory names are unique
      const subcategoryNames = subcategories.map(sub => sub.name);
      const duplicateNames = subcategoryNames.filter((name, index) => subcategoryNames.indexOf(name) !== index);
      
      if (duplicateNames.length > 0) {
        // Rollback parent category creation
        await category.destroy();
        throw new Error(`Duplicate subcategory names found: ${duplicateNames.join(', ')}`);
      }

      try {
        // Create subcategories sequentially to avoid race condition with category code generation
        for (let index = 0; index < subcategories.length; index++) {
          const subcategory = subcategories[index];
          const subCategoryCode = await this.generateCategoryCode();
          await ProductCategory.create({
            name: subcategory.name,
            description: subcategory.description,
            parentId: category.id,
            isActive: subcategory.isActive,
            displayOrder: subcategory.displayOrder ?? index,
            categoryCode: subCategoryCode,
          });
        }
      } catch (error) {
        // If subcategory creation fails, rollback the parent category
        await category.destroy();
        throw error;
      }

      // Refetch category with children
      return await ProductCategory.findByPk(category.id, {
        include: [
          { model: ProductCategory, as: 'parent' },
          { model: ProductCategory, as: 'children' },
        ],
      });
    }

    // Return category with parent if no subcategories
    return await ProductCategory.findByPk(category.id, {
      include: [{ model: ProductCategory, as: 'parent' }],
    });
  }

  // Get all categories with pagination
  async getCategories(query: QueryProductCategoriesDto) {
    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { categoryCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.parentId) {
      where.parentId = query.parentId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    const [categories, total] = await Promise.all([
      ProductCategory.findAll({
        where,
        offset: skip,
        limit,
        order: [[query.sortBy, query.sortOrder.toUpperCase()]],
        include: [
          {
            model: ProductCategory,
            as: 'parent',
            attributes: ['id', 'name', 'categoryCode']
          },
        ],
      }),
      ProductCategory.count({ where }),
    ]);

    return {
      data: categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get category hierarchy (tree structure)
  async getCategoryTree() {
    const categories = await ProductCategory.findAll({
      where: { parentId: null },
      order: [['displayOrder', 'ASC']],
      include: [
        {
          model: ProductCategory,
          as: 'children',
          order: [['displayOrder', 'ASC']],
          include: [
            {
              model: ProductCategory,
              as: 'children',
              order: [['displayOrder', 'ASC']],
            },
          ],
        },
      ],
    });

    return categories;
  }

  // Get category by ID
  async getCategoryById(id: string) {
    const category = await ProductCategory.findByPk(id, {
      include: [
        { model: ProductCategory, as: 'parent' },
        {
          model: ProductCategory,
          as: 'children',
          order: [['displayOrder', 'ASC']],
        },
      ],
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  // Update category
  async updateCategory(id: string, data: UpdateProductCategoryDto) {
    // Check if category exists
    const category = await ProductCategory.findByPk(id);

    if (!category) {
      throw new Error('Category not found');
    }

    // Validate parent exists if provided
    if (data.parentId) {
      // Cannot be its own parent
      if (data.parentId === id) {
        throw new Error('Category cannot be its own parent');
      }

      const parent = await ProductCategory.findByPk(data.parentId);
      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    await ProductCategory.update(data, { where: { id } });
    return await ProductCategory.findByPk(id, {
      include: [{ model: ProductCategory, as: 'parent' }],
    });
  }

  // Delete category
  async deleteCategory(id: string) {
    // Check if category exists
    const category = await ProductCategory.findByPk(id, {
      include: [
        { model: ProductCategory, as: 'children' },
      ],
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // For now, we'll need to check products separately since we don't have the relationship set up
    // This is a simplified version - in a full migration, you'd add the product relationship
    const childrenCount = category.children?.length || 0;
    if (childrenCount > 0) {
      throw new Error('Cannot delete category with subcategories. Please delete subcategories first.');
    }

    await ProductCategory.destroy({ where: { id } });
    return true;
  }

  // Get category statistics
  async getCategoryStats() {
    const [total, active] = await Promise.all([
      ProductCategory.count(),
      ProductCategory.count({ where: { isActive: true } }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      withProducts: 0, // TODO: Implement when product relationship is set up
    };
  }

  // Bulk upload categories from CSV or Excel file
  async bulkUploadCategories(file: Express.Multer.File) {
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
        if (rowNumber > 1) { // Skip header row
          const cells = row.values as any[];
          rows.push({
            name: cells[1]?.toString().trim(),
            description: cells[2]?.toString().trim() || undefined,
            parentName: cells[3]?.toString().trim() || undefined,
            isActive: cells[4]?.toString().toLowerCase() === 'true' || cells[4]?.toString() === '1',
            displayOrder: parseInt(cells[5]?.toString()) || 0,
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

      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parsing (handles basic commas, not complex escaping)
        const cells = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        if (cells.length < 1) continue;

        rows.push({
          name: cells[0]?.trim(),
          description: cells[1]?.trim() || undefined,
          parentName: cells[2]?.trim() || undefined,
          isActive: cells[3]?.toString().toLowerCase() === 'true' || cells[3]?.toString() === '1',
          displayOrder: parseInt(cells[4]?.toString()) || 0,
        });
      }
    }

    if (rows.length === 0) {
      throw new AppError(400, 'No valid data found in file');
    }

    // Validate data
    const errors = [];
    const categoriesToCreate = [];
    const categoriesToUpdate = [];

    console.log(`Processing ${rows.length} rows from file`);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      console.log(`Processing row ${i + 1}: ${row.name}`);
      if (!row.name) {
        errors.push(`Row ${i + 2}: Name is required`);
        continue;
      }

      // Check if category already exists in database
      const existingCategory = await ProductCategory.findOne({
        where: { name: row.name },
      });

      if (existingCategory) {
        console.log(`Category "${row.name}" already exists, checking for updates`);
        // Category exists, check if update is needed
        let needsUpdate =
          existingCategory.description !== (row.description || null) ||
          existingCategory.isActive !== row.isActive ||
          existingCategory.displayOrder !== row.displayOrder;

        // Check parent relationship
        if (row.parentName) {
          // Row has a parent, check if it matches existing
          const parentCategory = await ProductCategory.findOne({
            where: { name: row.parentName },
          });
          if (!parentCategory) {
            errors.push(`Row ${i + 2}: Parent category "${row.parentName}" not found`);
            continue;
          }
          if (existingCategory.parentId !== parentCategory.id) {
            needsUpdate = true;
            console.log(`Parent changed for "${row.name}": ${existingCategory.parentId} -> ${parentCategory.id}`);
          }
        } else {
          // Row has no parent, check if existing has a parent
          if (existingCategory.parentId !== null) {
            needsUpdate = true;
            console.log(`Removing parent for "${row.name}"`);
          }
        }

        if (needsUpdate) {
          console.log(`Category "${row.name}" needs update`);
          categoriesToUpdate.push({
            existing: existingCategory,
            newData: row,
            rowIndex: i + 2
          });
        } else {
          console.log(`Category "${row.name}" is up to date, skipping`);
        }
        // If no update needed, skip silently
      } else {
        console.log(`Category "${row.name}" does not exist, will create`);
        // Check for duplicate names in the file
        const duplicateInFile = rows.find((r, idx) => r.name === row.name && idx !== i);
        if (duplicateInFile) {
          errors.push(`Row ${i + 2}: Duplicate category name "${row.name}" in file`);
          continue;
        }

        categoriesToCreate.push(row);
      }
    }

    if (categoriesToCreate.length === 0 && categoriesToUpdate.length === 0) {
      // All categories already exist and don't need updates
      return {
        success: true,
        message: 'All categories already exist with current data. No changes needed.',
        data: {
          created: 0,
          updated: 0,
          skipped: rows.length,
          errors: errors.length > 0 ? errors : undefined,
          categories: [],
        },
      };
    }

    // Process updates first
    const updatedCategories = [];
    console.log(`Processing ${categoriesToUpdate.length} categories for update`);
    for (const updateItem of categoriesToUpdate) {
      try {
        const { existing, newData } = updateItem;
        console.log(`Updating category: ${newData.name}`);

        // Resolve parent ID if parentName is provided
        let parentId = null;
        if (newData.parentName) {
          const parentCategory = await ProductCategory.findOne({
            where: { name: newData.parentName },
          });
          if (parentCategory) {
            parentId = parentCategory.id;
            console.log(`Setting parent to: ${newData.parentName} (ID: ${parentId})`);
          }
        }

        await ProductCategory.update({
          description: newData.description || null,
          isActive: newData.isActive,
          displayOrder: newData.displayOrder,
          parentId: parentId,
        }, { where: { id: existing.id } });

        const updated = await ProductCategory.findByPk(existing.id, {
          include: [{ model: ProductCategory, as: 'parent' }],
        });
        updatedCategories.push(updated);
        updatedCategories.push(updated);
        console.log(`Successfully updated category: ${newData.name}`);
      } catch (error) {
        console.error(`Error updating category "${updateItem.newData.name}":`, error);
        errors.push(`Failed to update category "${updateItem.newData.name}": ${(error as Error).message}`);
      }
    }

    // Process parent categories first
    const createdCategories = [];
    const parentMap = new Map();

    // First pass: Create categories without parents
    for (const category of categoriesToCreate) {
      if (!category.parentName) {
        console.log(`Creating category without parent: ${category.name}`);
        const categoryCode = await this.generateCategoryCode();
        const created = await ProductCategory.create({
          name: category.name,
          description: category.description,
          isActive: category.isActive,
          displayOrder: category.displayOrder,
          categoryCode,
        });
        createdCategories.push(created);
        parentMap.set(category.name, created.id);
        console.log(`Created: ${created.name}`);
      }
    }

    // Second pass: Create categories with parents
    for (const category of categoriesToCreate) {
      if (category.parentName) {
        console.log(`Creating category with parent: ${category.name}, parent: ${category.parentName}`);
        const parentId = parentMap.get(category.parentName);
        if (!parentId) {
          // Try to find parent in database
          const parentInDb = await ProductCategory.findOne({
            where: { name: category.parentName },
          });
          if (!parentInDb) {
            errors.push(`Category "${category.name}": Parent category "${category.parentName}" not found`);
            continue;
          }
          parentMap.set(category.parentName, parentInDb.id);
        }

        const categoryCode = await this.generateCategoryCode();
        const created = await ProductCategory.create({
          name: category.name,
          description: category.description,
          parentId: parentMap.get(category.parentName),
          isActive: category.isActive,
          displayOrder: category.displayOrder,
          categoryCode,
        });
        createdCategories.push(created);
        parentMap.set(category.name, created.id);
        console.log(`Created: ${created.name}`);
      }
    }

    return {
      success: true,
      message: `Successfully processed ${createdCategories.length} new categories and ${updatedCategories.length} updated categories`,
      data: {
        created: createdCategories.length,
        updated: updatedCategories.length,
        errors: errors.length > 0 ? errors : undefined,
        categories: [...createdCategories, ...updatedCategories],
      },
    };
  }
}

