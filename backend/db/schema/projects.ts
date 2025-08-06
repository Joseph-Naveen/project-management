import { DataTypes, Model, Optional } from 'sequelize';
import { ProjectStatus, ProjectPriority } from '../../enums';

// Project interface
export interface ProjectAttributes {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  progress?: number;
  ownerId: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Interface for creating a project (without id, createdAt, updatedAt)
export interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'progress' | 'createdAt' | 'updatedAt'> {}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public status!: ProjectStatus;
  public priority!: ProjectPriority;
  public startDate?: Date;
  public endDate?: Date;
  public budget?: number;
  public progress?: number;
  public ownerId!: string;
  public tags?: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const ProjectSchema = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(ProjectStatus)),
    allowNull: false,
    defaultValue: ProjectStatus.PLANNING,
  },
  priority: {
    type: DataTypes.ENUM(...Object.values(ProjectPriority)),
    allowNull: false,
    defaultValue: ProjectPriority.MEDIUM,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
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
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  tags: {
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

export const ProjectIndexes = [
  {
    name: 'projects_owner_id_idx',
    fields: ['ownerId'],
  },
  {
    name: 'projects_status_idx',
    fields: ['status'],
  },
  {
    name: 'projects_priority_idx',
    fields: ['priority'],
  },
  {
    name: 'projects_start_date_idx',
    fields: ['startDate'],
  },
  {
    name: 'projects_end_date_idx',
    fields: ['endDate'],
  },
  {
    name: 'projects_name_idx',
    fields: ['name'],
  },
];

export const ProjectAssociations = (models: any) => {
  Project.belongsTo(models.User, {
    foreignKey: 'ownerId',
    as: 'owner',
  });

  Project.hasMany(models.Task, {
    foreignKey: 'projectId',
    as: 'tasks',
  });

  Project.hasMany(models.TimeLog, {
    foreignKey: 'projectId',
    as: 'timeLogs',
  });

  Project.hasMany(models.Comment, {
    foreignKey: 'projectId',
    as: 'comments',
  });

  Project.hasMany(models.Activity, {
    foreignKey: 'entityId',
    scope: { entity: 'project' },
    as: 'activities',
  });

  Project.belongsToMany(models.User, {
    through: 'ProjectMembers',
    foreignKey: 'projectId',
    otherKey: 'userId',
    as: 'members',
  });
}; 