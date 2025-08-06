import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';
import config from '../config/app';

class User extends Model {
  public id!: string;
  public email!: string;
  public name!: string;
  public password!: string;
  public avatar?: string;
  public role!: 'admin' | 'manager' | 'developer' | 'qa';
  public department?: string;
  public jobTitle?: string;
  public phone?: string;
  public isActive!: boolean;
  public isOnline?: boolean;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    if (!this.password) {
      return false;
    }
    return bcrypt.compare(candidatePassword, this.password);
  }

  public override toJSON(): any {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash', // Map to the actual database column
      validate: {
        notEmpty: true,
        len: [6, 255],
      },
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'developer', 'qa'),
      allowNull: false,
      defaultValue: 'developer',
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
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
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, config.security.bcryptRounds);
        }
      },
      beforeUpdate: async (user: User) => {
        // Only hash password if it has been changed and is not already hashed
        if (user.changed('password') && user.password) {
          // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
          if (!user.password.match(/^\$2[aby]\$/)) {
            user.password = await bcrypt.hash(user.password, config.security.bcryptRounds);
          }
        }
      },
    },
  }
);

export default User; 