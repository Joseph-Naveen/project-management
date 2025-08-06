import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TeamAttributes {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamCreationAttributes extends Optional<TeamAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface Team extends Model<TeamAttributes, TeamCreationAttributes>, TeamAttributes {
  // Association getters/setters will be typed by Sequelize
  getManager(): Promise<any>;
  setManager(manager: any): Promise<void>;
  getProjects(): Promise<any[]>;
  setProjects(projects: any[]): Promise<void>;
  addProject(project: any): Promise<void>;
  removeProject(project: any): Promise<void>;
}

const Team = sequelize.define<Team>('Team', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
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
  managerId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'manager_id', // Map to snake_case column name
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active', // Map to snake_case column name
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at', // Map to snake_case column name
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at', // Map to snake_case column name
  },
}, {
  tableName: 'teams',
  timestamps: true,
  indexes: [
    {
      fields: ['manager_id'], // Use snake_case column name for index
    },
    {
      fields: ['name'],
    },
    {
      fields: ['is_active'], // Use snake_case column name for index
    },
  ],
});

export default Team;
