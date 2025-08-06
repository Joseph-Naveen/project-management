import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class TimeLog extends Model {
  public id!: string;
  public description!: string;
  public duration!: number;
  public date!: Date;
  public startTime?: Date;
  public endTime?: Date;
  public userId!: string;
  public taskId?: string;
  public projectId!: string;
  public billable!: boolean;
  public hourlyRate?: number;
  public approved!: boolean;
  public approvedBy?: string;
  public approvedAt?: Date;
  public tags?: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TimeLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 1000],
      },
    },
    duration: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 24,
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endTime: {
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
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    billable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'time_logs',
    modelName: 'TimeLog',
    hooks: {
      beforeValidate: (timeLog: TimeLog) => {
        if (timeLog.startTime && timeLog.endTime) {
          if (new Date(timeLog.startTime) >= new Date(timeLog.endTime)) {
            throw new Error('Start time must be before end time');
          }
        }
        if (timeLog.duration && timeLog.duration > 24) {
          throw new Error('Duration cannot exceed 24 hours');
        }
      },
    },
  }
);

export default TimeLog; 