import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError,
  ConnectionError,
  TimeoutError,
  EmptyResultError,
  OptimisticLockError,
} from 'sequelize';
import { AppError } from './app-error';

/**
 * Handle Sequelize errors and convert them to AppError
 * @param error - The error thrown by Sequelize
 * @param resourceName - The name of the resource (e.g., 'Device', 'Product')
 * @throws AppError with appropriate status code and user-friendly message
 */
export const handleSequelizeError = (error: unknown, resourceName: string = 'Resource'): never => {
  // Handle Sequelize Unique Constraint Error
  if (error instanceof UniqueConstraintError) {
    const fields = error.fields ? Object.keys(error.fields).join(', ') : 'field';
    throw new AppError(
      409,
      `A ${resourceName.toLowerCase()} with this ${fields} already exists`
    );
  }

  // Handle Sequelize Foreign Key Constraint Error
  if (error instanceof ForeignKeyConstraintError) {
    const field = error.fields ? String(error.fields) : 'related record';
    throw new AppError(
      400,
      `Cannot perform operation: ${field} reference is invalid or does not exist`
    );
  }

  // Handle Sequelize Validation Error
  if (error instanceof ValidationError) {
    const validationErrors = error.errors.map(e => e.message).join(', ');
    throw new AppError(
      400,
      `Validation error: ${validationErrors}`
    );
  }

  // Handle Sequelize Empty Result Error
  if (error instanceof EmptyResultError) {
    throw new AppError(
      404,
      `${resourceName} not found`
    );
  }

  // Handle Sequelize Connection Error
  if (error instanceof ConnectionError) {
    throw new AppError(
      503,
      'Unable to connect to the database. Please try again later'
    );
  }

  // Handle Sequelize Timeout Error
  if (error instanceof TimeoutError) {
    throw new AppError(
      408,
      'Operation timed out while connecting to the database'
    );
  }

  // Handle Sequelize Optimistic Lock Error
  if (error instanceof OptimisticLockError) {
    throw new AppError(
      409,
      'Write conflict occurred. Please retry the transaction'
    );
  }

  // Handle Sequelize Database Error
  if (error instanceof DatabaseError) {
    // Check for specific database error codes
    const dbError = error as any;

    // Handle specific constraint violations
    if (dbError.parent) {
      const parentError = dbError.parent;

      // PostgreSQL error codes
      if (parentError.code) {
        switch (parentError.code) {
          case '23505': // unique_violation
            throw new AppError(
              409,
              `A ${resourceName.toLowerCase()} with this value already exists`
            );

          case '23503': // foreign_key_violation
            throw new AppError(
              400,
              'Cannot perform operation: related record does not exist'
            );

          case '23502': // not_null_violation
            throw new AppError(
              400,
              'Missing a required value'
            );

          case '23514': // check_violation
            throw new AppError(
              400,
              'Value does not meet database constraints'
            );

          case '22001': // string_data_right_truncation
            throw new AppError(
              400,
              'Input value is too long for the field'
            );

          case '22003': // numeric_value_out_of_range
            throw new AppError(
              400,
              'Numeric value is too large. Values must be less than 100,000,000.00'
            );

          case '22P02': // invalid_text_representation
            throw new AppError(
              400,
              'Invalid input format for the field type'
            );

          case '42P01': // undefined_table
            throw new AppError(
              500,
              'The table does not exist in the current database'
            );

          case '42703': // undefined_column
            console.error('Undefined column error:', {
              message: error.message,
              sql: (error as any).sql,
              parameters: (error as any).parameters
            });
            throw new AppError(
              500,
              `The column does not exist in the current database: ${error.message}`
            );
        }
      }
    }

    throw new AppError(
      500,
      `Database error occurred: ${error.message}`
    );
  }

  // Handle generic database connection errors
  if (error instanceof Error && 'code' in error) {
    const dbError = error as any;

    // Connection refused
    if (dbError.code === 'ECONNREFUSED') {
      throw new AppError(
        503,
        'Unable to connect to the database. Please check database configuration'
      );
    }

    // Connection timeout
    if (dbError.code === 'ETIMEDOUT') {
      throw new AppError(
        408,
        'Database connection timed out. Please try again'
      );
    }

    // Host not found
    if (dbError.code === 'ENOTFOUND') {
      throw new AppError(
        503,
        'Database host not found. Please check database configuration'
      );
    }
  }

  // If it's already an AppError, rethrow it
  if (error instanceof AppError) {
    throw error;
  }

  // If it's a generic error, wrap it
  if (error instanceof Error) {
    throw new AppError(
      500,
      error.message || 'An unexpected error occurred'
    );
  }

  // Unknown error type
  throw new AppError(
    500,
    'An unexpected error occurred'
  );
};

/**
 * Wrapper function to catch and handle Sequelize errors in service methods
 * @param fn - The async function to execute
 * @param resourceName - The name of the resource for error messages
 * @returns The result of the function or throws an AppError
 */
export const withSequelizeErrorHandling = async <T>(
  fn: () => Promise<T>,
  resourceName: string = 'Resource'
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    return handleSequelizeError(error, resourceName);
  }
};

// Backwards compatibility exports
export const handlePrismaError = handleSequelizeError;
export const withPrismaErrorHandling = withSequelizeErrorHandling;

