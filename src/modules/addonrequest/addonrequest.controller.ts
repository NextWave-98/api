import { Request, Response, NextFunction } from 'express';
import { AddonRequestService } from './addonrequest.service';
import { CreateAddonRequestDTO, UpdateAddonRequestDTO, AddonRequestQueryDTO } from './addonrequest.dto';

export class AddonRequestController {
  private addonRequestService: AddonRequestService;

  constructor() {
    this.addonRequestService = new AddonRequestService();
  }

  createAddonRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateAddonRequestDTO = req.body;

      const addonRequest = await this.addonRequestService.createAddonRequest(dto);

      res.status(201).json({
        success: true,
        message: 'Addon request created successfully',
        data: addonRequest,
      });
    } catch (error) {
      next(error);
    }
  };

  getAddonRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const addonRequest = await this.addonRequestService.getAddonRequest(id);

      res.status(200).json({
        success: true,
        data: addonRequest,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllAddonRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: AddonRequestQueryDTO = req.query as any;
      const result = await this.addonRequestService.getAllAddonRequests(dto);

      res.status(200).json({
        success: true,
        data: result.addonRequests,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  updateAddonRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const dto: UpdateAddonRequestDTO = req.body;

      const addonRequest = await this.addonRequestService.updateAddonRequest(id, dto);

      res.status(200).json({
        success: true,
        message: 'Addon request updated successfully',
        data: addonRequest,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteAddonRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.addonRequestService.deleteAddonRequest(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  getAddonRequestStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { locationId } = req.query;
      const stats = await this.addonRequestService.getAddonRequestStats(locationId as string);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  resendNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.addonRequestService.sendAdminNotification(id);

      res.status(200).json({
        success: true,
        message: 'Notification sent successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
