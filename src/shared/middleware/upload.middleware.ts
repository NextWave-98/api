import multer from 'multer';
import { AppError } from '../utils/app-error';

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter to accept only images and PDFs
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
  }
};

// File filter to accept CSV and Excel files
const csvFileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  const allowedExtensions = ['.csv', '.xlsx', '.xls'];

  const isValidMime = allowedMimes.includes(file.mimetype);
  const isValidExtension = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));

  if (isValidMime || isValidExtension) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV and Excel (.xlsx, .xls) files are allowed.'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Configure multer for CSV/Excel uploads
export const csvUpload = multer({
  storage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for CSV/Excel files
  },
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string = 'file') => {
  return upload.single(fieldName);
};

// Middleware for single CSV file upload
export const uploadCsvSingle = (fieldName: string = 'file') => {
  return csvUpload.single(fieldName);
};

// Middleware for multiple file uploads
export const uploadMultiple = (fieldName: string = 'documents', maxCount: number = 10) => {
  return upload.array(fieldName, maxCount);
};

// Middleware for multiple fields
export const uploadFields = (fields: multer.Field[]) => {
  return upload.fields(fields);
};


