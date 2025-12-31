import { AddonRequestStatus } from '../../models/addon-request.model';

export interface CreateAddonRequestDTO {
  productId: string;
  locationId: string;
  requestedBy: string;
  currentQuantity: number;
  requestedQuantity: number;
  remark?: string;
}

export interface UpdateAddonRequestDTO {
  status?: AddonRequestStatus;
  remark?: string;
}

export interface AddonRequestQueryDTO {
  productId?: string;
  locationId?: string;
  requestedBy?: string;
  status?: AddonRequestStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
