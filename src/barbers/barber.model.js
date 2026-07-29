import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';
import { generateUserId } from '../../helpers/uuid-generator.js';
import { User } from '../users/user.model.js';

export const BarberSchedule = sequelize.define(
  'BarberSchedule',
  {
    Id: {
      type: DataTypes.STRING(16),
      primaryKey: true,
      field: 'id',
      defaultValue: () => generateUserId(),
    },
    UserId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'user_id',
      references: { model: User, key: 'id' },
    },
    DayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'day_of_week',
      validate: {
        min: { args: [0], msg: 'dayOfWeek debe ser entre 0 (domingo) y 6 (sábado)' },
        max: { args: [6], msg: 'dayOfWeek debe ser entre 0 (domingo) y 6 (sábado)' },
      },
    },
    StartTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: 'start_time',
      validate: {
        is: { args: /^([01]\d|2[0-3]):[0-5]\d$/, msg: 'startTime debe tener formato HH:mm' },
      },
    },
    EndTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: 'end_time',
      validate: {
        is: { args: /^([01]\d|2[0-3]):[0-5]\d$/, msg: 'endTime debe tener formato HH:mm' },
      },
    },
    IsActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active',
    },
  },
  {
    tableName: 'barber_schedules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export const Review = sequelize.define(
  'Review',
  {
    Id: {
      type: DataTypes.STRING(16),
      primaryKey: true,
      field: 'id',
      defaultValue: () => generateUserId(),
    },
    BarberId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'barber_id',
      references: { model: User, key: 'id' },
    },
    ClientId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'client_id',
      references: { model: User, key: 'id' },
    },
    Rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'rating',
      validate: {
        min: { args: [1], msg: 'La calificación debe ser entre 1 y 5' },
        max: { args: [5], msg: 'La calificación debe ser entre 1 y 5' },
      },
    },
    Comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'comment',
    },
    IsActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active',
    },
  },
  {
    tableName: 'reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

User.hasMany(BarberSchedule, { foreignKey: 'user_id', as: 'BarberSchedules' });
BarberSchedule.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

User.hasMany(Review, { foreignKey: 'barber_id', as: 'BarberReviews' });
Review.belongsTo(User, { foreignKey: 'barber_id', as: 'Barber' });

User.hasMany(Review, { foreignKey: 'client_id', as: 'ClientReviews' });
Review.belongsTo(User, { foreignKey: 'client_id', as: 'Client' });
