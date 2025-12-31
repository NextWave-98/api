import { Repair, JobSheet, Customer, Device } from '../../models';
import { AppError } from '../../shared/utils/app-error';
import { CreateRepairDTO, UpdateRepairDTO } from './repair.dto';

export class RepairService {
  async createRepair(data: CreateRepairDTO) {
    const jobSheet = await JobSheet.findByPk(data.jobSheetId);

    if (!jobSheet) {
      throw new AppError(404, 'Job sheet not found');
    }

    const repair = await Repair.create({
      ...data,
      startTime: data.startTime ? new Date(data.startTime) : null,
      endTime: data.endTime ? new Date(data.endTime) : null,
    });

    await repair.reload({
      include: [
        {
          model: JobSheet,
          as: 'jobSheet',
          attributes: ['id', 'jobNumber', 'status'],
        },
      ],
    });

    return repair;
  }

  async getRepairs(jobSheetId?: string) {
    const where = jobSheetId ? { jobSheetId } : {};

    const repairs = await Repair.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: JobSheet,
          as: 'jobSheet',
          attributes: ['id', 'jobNumber'],
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: ['name', 'phone'],
            },
            {
              model: Device,
              as: 'device',
              attributes: ['brand', 'model'],
            },
          ],
        },
      ],
    });

    return repairs;
  }

  async getRepairById(id: string) {
    const repair = await Repair.findByPk(id, {
      include: [
        {
          model: JobSheet,
          as: 'jobSheet',
          include: [
            {
              model: Customer,
              as: 'customer',
            },
            {
              model: Device,
              as: 'device',
            },
          ],
        },
      ],
    });

    if (!repair) {
      throw new AppError(404, 'Repair not found');
    }

    return repair;
  }

  async updateRepair(id: string, data: UpdateRepairDTO) {
    const existingRepair = await Repair.findByPk(id);

    if (!existingRepair) {
      throw new AppError(404, 'Repair not found');
    }

    const updateData: any = { ...data };
    if (data.startTime) {
      updateData.startTime = new Date(data.startTime);
    }
    if (data.endTime) {
      updateData.endTime = new Date(data.endTime);
    }

    await Repair.update(updateData, { where: { id } });

    const repair = await Repair.findByPk(id, {
      include: [
        {
          model: JobSheet,
          as: 'jobSheet',
          attributes: ['id', 'jobNumber'],
        },
      ],
    });

    return repair;
  }

  async deleteRepair(id: string) {
    const repair = await Repair.findByPk(id);

    if (!repair) {
      throw new AppError(404, 'Repair not found');
    }

    await Repair.destroy({ where: { id } });

    return { message: 'Repair deleted successfully' };
  }
}

