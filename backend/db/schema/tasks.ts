import { DataTypes, Model, Optional } from 'sequelize';
import { TaskStatus, TaskPriority } from '../../enums';

// Task interface
export interface TaskAttributes {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  creatorId: string;
  projectId: string;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  labels?: string[];
  tags?: string[];
  watchers?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Interface for creating a task (without id, createdAt, updatedAt)
export interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'progress' | 'actualHours' | 'createdAt' | 'updatedAt'> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: string;
  public title!: string;
  public description?: string;
  public status!: TaskStatus;
  public priority!: TaskPriority;
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
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const TaskSchema = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(TaskStatus)),
    allowNull: false,
    defaultValue: TaskStatus.TODO,
  },
  priority: {
    type: DataTypes.ENUM(...Object.values(TaskPriority)),
    allowNull: false,
    defaultValue: TaskPriority.MEDIUM,
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
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  },
  labels: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  watchers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
};

export const TaskIndexes = [
  {
    name: 'tasks_project_id_idx',
    fields: ['projectId'],
  },
  {
    name: 'tasks_assignee_id_idx',
    fields: ['assigneeId'],
  },
  {
    name: 'tasks_creator_id_idx',
    fields: ['creatorId'],
  },
  {
    name: 'tasks_status_idx',
    fields: ['status'],
  },
  {
    name: 'tasks_priority_idx',
    fields: ['priority'],
  },
  {
    name: 'tasks_due_date_idx',
    fields: ['dueDate'],
  },
  {
    name: 'tasks_title_idx',
    fields: ['title'],
  },
];

export const TaskAssociations = (models: any) => {
  Task.belongsTo(models.User, {
    foreignKey: 'assigneeId',
    as: 'assignee',
  });

  Task.belongsTo(models.User, {
    foreignKey: 'creatorId',
    as: 'creator',
  });

  Task.belongsTo(models.Project, {
    foreignKey: 'projectId',
    as: 'project',
  });

  Task.hasMany(models.Comment, {
    foreignKey: 'taskId',
    as: 'comments',
  });

  Task.hasMany(models.TimeLog, {
    foreignKey: 'taskId',
    as: 'timeLogs',
  });

  Task.hasMany(models.Activity, {
    foreignKey: 'entityId',
    scope: { entity: 'task' },
    as: 'activities',
  });

  Task.hasMany(models.TaskDependency, {
    foreignKey: 'taskId',
    as: 'dependencies',
  });

  Task.hasMany(models.TaskDependency, {
    foreignKey: 'dependentTaskId',
    as: 'dependents',
  });
}; 