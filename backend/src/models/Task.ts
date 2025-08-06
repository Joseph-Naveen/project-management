import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Task extends Model {
  public id!: string;
  public title!: string;
  public description?: string;
  public status!: 'todo' | 'in_progress' | 'review' | 'done';
  public priority!: 'low' | 'medium' | 'high' | 'critical';
  public assigneeId?: string;
  public creatorId!: string;
  public projectId!: string;
  public dueDate?: Date;
  public estimatedHours?: number;
  public actualHours?: number;
  public progress?: number;
  public labels?: string[];
  public tags?: string[];
  public watchers?: string[];
  public dependencies?: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done'),
      allowNull: false,
      defaultValue: 'todo',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
    },
    assigneeId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    creatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    actualHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    labels: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    watchers: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      defaultValue: [],
    },
    dependencies: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'tasks',
    modelName: 'Task',
    hooks: {
      beforeValidate: (task: Task) => {
        if (task.estimatedHours && task.estimatedHours < 0) {
          throw new Error('Estimated hours cannot be negative');
        }
        if (task.actualHours && task.actualHours < 0) {
          throw new Error('Actual hours cannot be negative');
        }
      },
    },
  }
);

export default Task; 