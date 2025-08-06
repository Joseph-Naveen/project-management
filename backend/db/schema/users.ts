import { DataTypes, Model, Optional } from 'sequelize';
import { UserRole, UserStatus } from '../../enums';

// User interface
export interface UserAttributes {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  jobTitle?: string;
  phone?: string;
  isActive: boolean;
  isOnline: boolean;
  passwordHash: string;
  lastLoginAt?: Date;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    timezone?: string;
    language?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Interface for creating a user (without id, createdAt, updatedAt)
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'isOnline' | 'createdAt' | 'updatedAt'> {
  password: string; // Plain password for hashing
}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public name!: string;
  public avatar?: string;
  public role!: UserRole;
  public department?: string;
  public jobTitle?: string;
  public phone?: string;
  public isActive!: boolean;
  public isOnline!: boolean;
  public passwordHash!: string;
  public lastLoginAt?: Date;
  public preferences?: {
    theme?: 'light' | 'dark' | 'system';
    timezone?: string;
    language?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  };
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const UserSchema = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM(...Object.values(UserRole)),
    allowNull: false,
    defaultValue: UserRole.TEAM_MEMBER,
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  jobTitle: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      theme: 'light',
      timezone: 'UTC',
      language: 'en',
      emailNotifications: true,
      pushNotifications: true,
    },
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

export const UserIndexes = [
  {
    name: 'users_email_idx',
    fields: ['email'],
  },
  {
    name: 'users_role_idx',
    fields: ['role'],
  },
  {
    name: 'users_department_idx',
    fields: ['department'],
  },
  {
    name: 'users_is_active_idx',
    fields: ['isActive'],
  },
];

export const UserAssociations = (models: any) => {
  User.hasMany(models.Project, {
    foreignKey: 'ownerId',
    as: 'ownedProjects',
  });

  User.hasMany(models.Task, {
    foreignKey: 'assigneeId',
    as: 'assignedTasks',
  });

  User.hasMany(models.Task, {
    foreignKey: 'creatorId',
    as: 'createdTasks',
  });

  User.hasMany(models.Comment, {
    foreignKey: 'authorId',
    as: 'comments',
  });

  User.hasMany(models.TimeLog, {
    foreignKey: 'userId',
    as: 'timeLogs',
  });

  User.hasMany(models.Notification, {
    foreignKey: 'userId',
    as: 'notifications',
  });

  User.hasMany(models.Activity, {
    foreignKey: 'actorId',
    as: 'activities',
  });

  User.belongsToMany(models.Project, {
    through: 'ProjectMembers',
    foreignKey: 'userId',
    otherKey: 'projectId',
    as: 'projects',
  });
}; 