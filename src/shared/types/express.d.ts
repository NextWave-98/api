declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        roleName: string;
        permissions: string[];
        locationId?: string;
        branchId?: string; // Legacy support - deprecated
      };
    }
  }
}

export {};

