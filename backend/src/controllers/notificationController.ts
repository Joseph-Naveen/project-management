import { Request, Response } from 'express';
import { Notification, User } from '../models';
import { AppError } from '../types';

// Get all notifications for user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = { userId };

    if (unreadOnly === 'true') {
      where.read = false;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        notifications: notifications.map(notification => notification.toJSON()),
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch notifications', 500);
  }
};

// Get notification by ID
export const getNotificationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const notification = await Notification.findOne({
      where: { id, userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        notification: notification.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch notification', 500);
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    await notification.update({ read: true });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification: notification.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to mark notification as read', 500);
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    await Notification.update(
      { read: true },
      { where: { userId, read: false } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    throw new AppError('Failed to mark all notifications as read', 500);
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    await notification.destroy();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete notification', 500);
  }
};

// Get unread notifications count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const count = await Notification.count({
      where: { userId, read: false },
    });

    res.status(200).json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch unread count', 500);
  }
};

// Create notification (internal use)
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any
) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      read: false,
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}; 