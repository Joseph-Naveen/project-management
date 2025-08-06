import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Attachment extends Model {
  public id!: string;
  public name!: string;
  public url!: string;
  public size!: number;
  public mimeType!: string;
  public uploadedBy!: string;
  public taskId?: string;
  public commentId?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Attachment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        isUrl: true,
      },
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    uploadedBy: {
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
    commentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'attachments',
    modelName: 'Attachment',
    hooks: {
      beforeValidate: (attachment: Attachment) => {
        // Ensure either taskId or commentId is provided, but not both
        if (!attachment.taskId && !attachment.commentId) {
          throw new Error('Attachment must be associated with either a task or comment');
        }
        if (attachment.taskId && attachment.commentId) {
          throw new Error('Attachment cannot be associated with both task and comment');
        }
      },
    },
  }
);

export default Attachment; 