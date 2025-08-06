import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Comment extends Model {
  public id!: string;
  public content!: string;
  public authorId!: string;
  public taskId?: string;
  public projectId?: string;
  public parentId?: string;
  public mentions?: string[];
  public isEdited?: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 5000],
      },
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tasks',
        key: 'id',
      },
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id',
      },
    },
    mentions: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      defaultValue: [],
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'comments',
    modelName: 'Comment',
    hooks: {
      beforeValidate: (comment: Comment) => {
        // Ensure either taskId or projectId is provided, but not both
        if (!comment.taskId && !comment.projectId) {
          throw new Error('Comment must be associated with either a task or project');
        }
        if (comment.taskId && comment.projectId) {
          throw new Error('Comment cannot be associated with both task and project');
        }
      },
    },
  }
);

export default Comment; 