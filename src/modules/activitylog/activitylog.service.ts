import { AppError } from '../../shared/utils/app-error';
import { CreateActivityLogDTO, ActivityLogQueryDTO } from './activitylog.dto';
import { ActivityLog, User } from '../../models';
import { Op, fn, col } from 'sequelize';

export class ActivityLogService {
  async createActivityLog(
    data: CreateActivityLogDTO,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const activityLog = await ActivityLog.create({
      userId,
      action: data.action,
      module: data.module,
      recordId: data.recordId,
      details: data.details,
      ipAddress,
      userAgent,
    });

    await activityLog.reload({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return activityLog.toJSON();
  }

  async getActivityLogs(query: ActivityLogQueryDTO) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.action) {
      where.action = { [Op.iLike]: `%${query.action}%` };
    }

    if (query.module) {
      where.module = { [Op.iLike]: `%${query.module}%` };
    }

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) {
        where.createdAt[Op.gte] = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.createdAt[Op.lte] = new Date(query.toDate);
      }
    }

    const [activityLogs, total] = await Promise.all([
      ActivityLog.findAll({
        where,
        offset: skip,
        limit,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      }),
      ActivityLog.count({ where }),
    ]);

    return {
      activityLogs: activityLogs.map(log => log.toJSON()),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getActivityLogById(id: string) {
    const activityLog = await ActivityLog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!activityLog) {
      throw new AppError(404, 'Activity log not found');
    }

    return activityLog.toJSON();
  }

  async getUserActivityLogs(userId: string, limit: number = 50) {
    const activityLogs = await ActivityLog.findAll({
      where: { userId },
      limit,
      order: [['createdAt', 'DESC']],
    });

    return activityLogs.map(log => log.toJSON());
  }

  async getRecentActivity(limit: number = 20) {
    const activityLogs = await ActivityLog.findAll({
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return activityLogs.map(log => log.toJSON());
  }

  async getActivityStats(fromDate?: string, toDate?: string) {
    const where: any = {};

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) where.createdAt[Op.lte] = new Date(toDate);
    }

    const [total, byAction, byModule, byUser] = await Promise.all([
      ActivityLog.count({ where }),
      ActivityLog.findAll({
        where,
        attributes: [
          'action',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['action'],
        raw: true
      }),
      ActivityLog.findAll({
        where,
        attributes: [
          'module',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['module'],
        raw: true
      }),
      ActivityLog.findAll({
        where,
        attributes: [
          'userId',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['userId'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        limit: 10,
        raw: true
      }),
    ]);

    const actionStats = (byAction as any[]).reduce((acc: any, item: any) => {
      acc[item.action] = parseInt(item.count as string);
      return acc;
    }, {});

    const moduleStats = (byModule as any[]).reduce((acc: any, item: any) => {
      acc[item.module] = parseInt(item.count as string);
      return acc;
    }, {});

    const userStats = await Promise.all(
      (byUser as any[]).map(async (item: any) => {
        const user = await User.findByPk(item.userId, {
          attributes: ['id', 'name', 'email']
        });
        return {
          user: user?.toJSON(),
          count: parseInt(item.count as string),
        };
      })
    );

    return {
      total,
      byAction: actionStats,
      byModule: moduleStats,
      topUsers: userStats,
    };
  }

  async deleteOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deletedCount = await ActivityLog.destroy({
      where: {
        createdAt: {
          [Op.lt]: cutoffDate,
        },
      },
    });

    return {
      message: `Deleted ${deletedCount} activity logs older than ${daysToKeep} days`,
      deletedCount,
    };
  }

  async logAction(
    userId: string,
    action: string,
    module: string,
    recordId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.createActivityLog(
      {
        action,
        module,
        recordId,
        details,
      },
      userId,
      ipAddress,
      userAgent
    );
  }
}

