import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Notification extends Model {
  public id!: string;
  public type!: string;
  public title!: string;
  public message!: string;
  public category!: 'system' | 'project' | 'task' | 'comment' | 'mention' | 'deadline' | 'timesheet';
  public priority!: 'low' | 'medium' | 'high' | 'critical';
  public read!: boolean;
  public readAt?: Date;
  public userId!: string;
  public actionUrl?: string;
  public metadata?: any;
  public data?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    category: {
      type: DataTypes.ENUM('system', 'project', 'task', 'comment', 'mention', 'deadline', 'timesheet'),
      allowNull: false,
      defaultValue: 'system',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    actionUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    modelName: 'Notification',
  }
);

export default Notification; 