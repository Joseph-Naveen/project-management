import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Activity extends Model {
  public id!: string;
  public type!: 'create' | 'update' | 'delete' | 'comment' | 'assign' | 'complete';
  public entity!: 'project' | 'task' | 'comment' | 'user';
  public entityId!: string;
  public actorId!: string;
  public description!: string;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Activity.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('create', 'update', 'delete', 'comment', 'assign', 'complete'),
      allowNull: false,
    },
    entity: {
      type: DataTypes.ENUM('project', 'task', 'comment', 'user'),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'activities',
    modelName: 'Activity',
  }
);

export default Activity; 