import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Comment, User } from '../models';
import { AppError } from '../types';

// Get all comments
export const getComments = async (req: Request, res: Response) => {
  try {
    const { taskId, projectId, parentId } = req.query;

    const where: any = {};

    if (taskId) {
      where.taskId = taskId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (parentId) {
      where.parentId = parentId;
    }

    const comments = await Comment.findAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: {
        comments: comments.map(comment => comment.toJSON()),
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch comments', 500);
  }
};

// Get comment by ID
export const getCommentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        comment: comment.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch comment', 500);
  }
};

// Create comment
export const createComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { content, taskId, projectId, parentId, mentions = [] } = req.body;

    if (!content) {
      throw new AppError('Comment content is required', 400);
    }

    if (!taskId && !projectId) {
      throw new AppError('Comment must be associated with a task or project', 400);
    }

    if (taskId && projectId) {
      throw new AppError('Comment cannot be associated with both task and project', 400);
    }

    // Create comment
    const comment = await Comment.create({
      content,
      authorId: userId,
      taskId,
      projectId,
      parentId,
      mentions,
    });

    const createdComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        comment: createdComment?.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create comment', 500);
  }
};

// Update comment
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = (req as any).user?.id;

    if (!content) {
      throw new AppError('Comment content is required', 400);
    }

    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Check if user is the author
    if (comment.authorId !== userId) {
      throw new AppError('You can only edit your own comments', 403);
    }

    // Update comment
    await comment.update({
      content,
      isEdited: true,
    });

    const updatedComment = await Comment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment: updatedComment?.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update comment', 500);
  }
};

// Delete comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Check if user is the author or admin
    if (comment.authorId !== userId && (req as any).user?.role !== 'admin') {
      throw new AppError('You can only delete your own comments', 403);
    }

    // Delete comment and its replies
    await Comment.destroy({
      where: {
        [Op.or]: [
          { id },
          { parentId: id },
        ],
      },
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete comment', 500);
  }
};

// Add reaction to comment
export const addReaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = (req as any).user?.id;

    if (!emoji) {
      throw new AppError('Emoji is required', 400);
    }

    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // For now, we'll return a mock response
    // In a real implementation, you would store reactions in a separate table
    res.status(200).json({
      success: true,
      message: 'Reaction added successfully',
      data: {
        reaction: {
          id: 'reaction-id',
          emoji,
          userId,
          commentId: id,
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to add reaction', 500);
  }
};

// Remove reaction from comment
export const removeReaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = (req as any).user?.id;

    if (!emoji) {
      throw new AppError('Emoji is required', 400);
    }

    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // For now, we'll return a mock response
    res.status(200).json({
      success: true,
      message: 'Reaction removed successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to remove reaction', 500);
  }
};

// Upload attachment to comment
export const uploadAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // For now, we'll return a mock response
    // In a real implementation, you would handle file upload
    res.status(200).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: {
        attachment: {
          id: 'attachment-id',
          name: 'document.pdf',
          url: 'https://example.com/attachments/document.pdf',
          size: 1024,
          mimeType: 'application/pdf',
          commentId: id,
          uploadedBy: userId,
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to upload attachment', 500);
  }
}; 