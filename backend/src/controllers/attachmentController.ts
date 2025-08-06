import { Request, Response } from 'express';
import { Attachment, User, Task, Comment } from '../models';
import { AppError } from '../types';

// Get attachment by ID
export const getAttachmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attachment = await Attachment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title'],
        },
        {
          model: Comment,
          as: 'comment',
          attributes: ['id', 'content'],
        },
      ],
    });

    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        attachment: attachment.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch attachment', 500);
  }
};

// Upload attachment
export const uploadAttachment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { taskId, commentId, name, description } = req.body;

    // For now, we'll return a mock response
    // In a real implementation, you would handle file upload using multer
    const attachment = {
      id: 'attachment-id',
      name: name || 'document.pdf',
      originalName: name || 'document.pdf',
      url: 'https://example.com/attachments/document.pdf',
      size: 1024 * 1024, // 1MB
      mimeType: 'application/pdf',
      taskId,
      commentId,
      uploadedBy: userId,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: {
        attachment,
      },
    });
  } catch (error) {
    throw new AppError('Failed to upload attachment', 500);
  }
};

// Delete attachment
export const deleteAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const attachment = await Attachment.findByPk(id);
    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    // Check if user owns the attachment or is admin
    if (attachment.uploadedBy !== userId && (req as any).user?.role !== 'admin') {
      throw new AppError('You can only delete your own attachments', 403);
    }

    await attachment.destroy();

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete attachment', 500);
  }
};

// Download attachment
export const downloadAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attachment = await Attachment.findByPk(id);
    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    // For now, we'll return a mock response
    // In a real implementation, you would serve the actual file
    res.status(200).json({
      success: true,
      data: {
        downloadUrl: attachment.url,
        filename: attachment.name,
        mimeType: attachment.mimeType,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to download attachment', 500);
  }
};

// Get attachments by entity
export const getAttachmentsByEntity = async (req: Request, res: Response) => {
  try {
    const { taskId, commentId } = req.query;

    const where: any = {};
    if (taskId) {
      where.taskId = taskId;
    }
    if (commentId) {
      where.commentId = commentId;
    }

    const attachments = await Attachment.findAll({
      where,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        attachments: attachments.map(attachment => attachment.toJSON()),
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch attachments', 500);
  }
}; 