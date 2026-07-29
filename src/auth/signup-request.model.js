import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';
import { generateUserId } from '../../helpers/uuid-generator.js';

export const SignupRequest = sequelize.define(
  'SignupRequest',
  {
    Id: {
      type: DataTypes.STRING(16),
      primaryKey: true,
      field: 'id',
      defaultValue: () => generateUserId(),
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name',
    },
    Email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      field: 'email',
      validate: { isEmail: true },
    },
    PasswordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    Phone: {
      type: DataTypes.STRING(8),
      allowNull: false,
      field: 'phone',
    },
    ProfilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'profile_picture',
    },
    Status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING',
      field: 'status',
    },
    ApprovedBy: {
      type: DataTypes.STRING(16),
      allowNull: true,
      field: 'approved_by',
    },
    ApprovedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
  },
  {
    tableName: 'signup_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
