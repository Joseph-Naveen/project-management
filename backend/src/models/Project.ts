import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Project extends Model {
  public id!: string;
  public name!: string;
  public description?: string;
  public status!: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  public priority!: 'low' | 'medium' | 'high' | 'critical';
  public startDate?: Date;
  public endDate?: Date;
  public budget?: number;
  public progress?: number;
  public ownerId!: string;
  public teamId?: string;
  public tags?: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'planning',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
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
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'team_id', // Map to snake_case column name
      references: {
        model: 'teams',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'projects',
    modelName: 'Project',
    hooks: {
      beforeValidate: (project: Project) => {
        if (project.startDate && project.endDate) {
          if (new Date(project.startDate) > new Date(project.endDate)) {
            throw new Error('Start date cannot be after end date');
          }
        }
      },
    },
  }
);

export default Project; 