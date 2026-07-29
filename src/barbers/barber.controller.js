import { asyncHandler } from '../../middlewares/server-genericError-handler.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { ADMIN_ROLE, EMPLOYEE_ROLE } from '../../helpers/role-constants.js';
import { User, UserProfile, UserEmail } from '../users/user.model.js';
import { UserRole, Role } from '../auth/role.model.js';
import { BarberSchedule, Review } from './barber.model.js';
import { findUserById, checkUserExists } from '../../helpers/user-db.js';
import { getUserRoleNames } from '../../helpers/role-db.js';
import { hashPassword } from '../../utils/password-utils.js';
import { getFullImageUrl, getDefaultAvatarPath } from '../../helpers/cloudinary-service.js';
import { sequelize } from '../../configs/db.js';

const ensureAdmin = async (req) => {
  const currentUserId = req.userId;
  if (!currentUserId) return false;
  const roles =
    req.user?.UserRoles?.map((ur) => ur.Role?.Name).filter(Boolean) ??
    (await getUserRoleNames(currentUserId));
  return roles.includes(ADMIN_ROLE);
};

const getScheduleForBarber = async (barberId) => {
  const schedules = await BarberSchedule.findAll({
    where: { UserId: barberId, IsActive: true },
    order: [['day_of_week', 'ASC']],
  });
  return schedules.map((s) => ({
    id: s.Id,
    dayOfWeek: s.DayOfWeek,
    startTime: s.StartTime,
    endTime: s.EndTime,
  }));
};

const getReviewStats = async (barberId) => {
  const result = await Review.findAll({
    where: { BarberId: barberId, IsActive: true },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
      [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
    ],
    raw: true,
  });
  const stats = result[0] || { total: '0', average: null };
  return {
    total: parseInt(stats.total, 10) || 0,
    average: stats.average ? parseFloat(parseFloat(stats.average).toFixed(1)) : null,
  };
};

const buildBarberResponse = (user, schedule, reviewStats) => ({
  id: user.Id,
  name: user.Name,
  email: user.Email,
  phone: user.UserProfile?.Phone || '',
  profilePicture: user.UserProfile?.Imagen
    ? getFullImageUrl(user.UserProfile.Imagen)
    : getFullImageUrl(getDefaultAvatarPath()),
  isActive: user.IsActive,
  schedule: schedule || [],
  reviews: reviewStats || { total: 0, average: null },
});

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// POST /api/v1/barbers - Admin creates barber (employee + schedule)
export const createBarber = [
  validateJWT,
  asyncHandler(async (req, res) => {
    if (!(await ensureAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { name, email, password, phone, profilePicture, schedule } = req.body || {};

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'name, email, password y phone son requeridos',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await checkUserExists(normalizedEmail)) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con este email',
      });
    }

    const transaction = await sequelize.transaction();

    try {
      const hashedPassword = await hashPassword(password);

      const user = await User.create(
        {
          Name: name,
          Email: normalizedEmail,
          Password: hashedPassword,
          IsActive: true,
        },
        { transaction }
      );

      const defaultAvatar = getDefaultAvatarPath();
      await UserProfile.create(
        {
          UserId: user.Id,
          Phone: phone,
          Imagen: profilePicture || defaultAvatar,
        },
        { transaction }
      );

      await UserEmail.create(
        {
          UserId: user.Id,
          EmailVerified: true,
          EmailVerificationToken: null,
          EmailVerificationTokenExpiry: null,
        },
        { transaction }
      );

      const employeeRole = await Role.findOne({
        where: { Name: EMPLOYEE_ROLE },
        transaction,
      });

      if (!employeeRole) {
        throw new Error('EMPLOYEE_ROLE not found in database');
      }

      await UserRole.create(
        { UserId: user.Id, RoleId: employeeRole.Id },
        { transaction }
      );

      if (schedule && Array.isArray(schedule)) {
        for (const entry of schedule) {
          await BarberSchedule.create(
            {
              UserId: user.Id,
              DayOfWeek: entry.dayOfWeek,
              StartTime: entry.startTime,
              EndTime: entry.endTime,
            },
            { transaction }
          );
        }
      }

      await transaction.commit();

      const barberSchedule = await getScheduleForBarber(user.Id);
      const reviewStats = await getReviewStats(user.Id);

      return res.status(201).json({
        success: true,
        message: 'Barbero creado exitosamente',
        data: buildBarberResponse(
          await findUserById(user.Id),
          barberSchedule,
          reviewStats
        ),
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }),
];

// PUT /api/v1/barbers/:id - Admin updates barber info
export const updateBarber = [
  validateJWT,
  asyncHandler(async (req, res) => {
    if (!(await ensureAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;
    const { name, phone, profilePicture } = req.body || {};

    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Barbero no encontrado' });
    }

    const updateData = {};
    if (name) updateData.Name = name;

    if (Object.keys(updateData).length > 0) {
      await User.update(updateData, { where: { Id: id } });
    }

    const profileUpdate = {};
    if (phone) profileUpdate.Phone = phone;
    if (profilePicture !== undefined) profileUpdate.Imagen = profilePicture;

    if (Object.keys(profileUpdate).length > 0) {
      await UserProfile.update(profileUpdate, { where: { UserId: id } });
    }

    const updatedUser = await findUserById(id);
    const barberSchedule = await getScheduleForBarber(id);
    const reviewStats = await getReviewStats(id);

    return res.status(200).json({
      success: true,
      message: 'Barbero actualizado exitosamente',
      data: buildBarberResponse(updatedUser, barberSchedule, reviewStats),
    });
  }),
];

// PUT /api/v1/barbers/:id/schedule - Admin replaces barber schedule
export const updateBarberSchedule = [
  validateJWT,
  asyncHandler(async (req, res) => {
    if (!(await ensureAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;
    const { schedule } = req.body || {};

    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Barbero no encontrado' });
    }

    if (!Array.isArray(schedule)) {
      return res.status(400).json({
        success: false,
        message: 'schedule debe ser un array de horarios',
      });
    }

    const transaction = await sequelize.transaction();

    try {
      await BarberSchedule.update(
        { IsActive: false },
        { where: { UserId: id }, transaction }
      );

      for (const entry of schedule) {
        const existing = await BarberSchedule.findOne({
          where: { UserId: id, DayOfWeek: entry.dayOfWeek },
          transaction,
        });

        if (existing) {
          await existing.update(
            {
              StartTime: entry.startTime,
              EndTime: entry.endTime,
              IsActive: true,
            },
            { transaction }
          );
        } else {
          await BarberSchedule.create(
            {
              UserId: id,
              DayOfWeek: entry.dayOfWeek,
              StartTime: entry.startTime,
              EndTime: entry.endTime,
            },
            { transaction }
          );
        }
      }

      await transaction.commit();

      const barberSchedule = await getScheduleForBarber(id);

      return res.status(200).json({
        success: true,
        message: 'Horario actualizado exitosamente',
        data: barberSchedule,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }),
];

// PATCH /api/v1/barbers/:id/toggle-active - Admin toggle barber active status
export const toggleBarberActive = [
  validateJWT,
  asyncHandler(async (req, res) => {
    if (!(await ensureAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Barbero no encontrado' });
    }

    user.IsActive = !user.IsActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: user.IsActive ? 'Barbero activado' : 'Barbero desactivado',
      data: { id: user.Id, isActive: user.IsActive },
    });
  }),
];

// GET /api/v1/barbers - Public list active barbers
export const listBarbers = asyncHandler(async (req, res) => {
  const employeeRole = await Role.findOne({ where: { Name: EMPLOYEE_ROLE } });
  if (!employeeRole) {
    return res.status(200).json({ success: true, data: [] });
  }

  const barbers = await User.findAll({
    where: { IsActive: true },
    include: [
      { model: UserProfile, as: 'UserProfile' },
      {
        model: UserRole,
        as: 'UserRoles',
        where: { RoleId: employeeRole.Id },
        include: [{ model: Role, as: 'Role' }],
      },
    ],
  });

  const result = await Promise.all(
    barbers.map(async (barber) => {
      const schedule = await getScheduleForBarber(barber.Id);
      const reviewStats = await getReviewStats(barber.Id);
      return buildBarberResponse(barber, schedule, reviewStats);
    })
  );

  return res.status(200).json({ success: true, data: result });
});

// GET /api/v1/barbers/:id - Public get barber detail
export const getBarberById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    include: [
      { model: UserProfile, as: 'UserProfile' },
      {
        model: UserRole,
        as: 'UserRoles',
        include: [{ model: Role, as: 'Role' }],
      },
    ],
  });

  if (!user || !user.IsActive) {
    return res.status(404).json({ success: false, message: 'Barbero no encontrado' });
  }

  const hasEmployeeRole = user.UserRoles?.some(
    (ur) => ur.Role?.Name === EMPLOYEE_ROLE
  );
  if (!hasEmployeeRole) {
    return res.status(404).json({ success: false, message: 'Barbero no encontrado' });
  }

  const schedule = await getScheduleForBarber(id);
  const reviewStats = await getReviewStats(id);

  return res.status(200).json({
    success: true,
    data: buildBarberResponse(user, schedule, reviewStats),
  });
});

// GET /api/v1/barbers/:id/reviews - Public get barber reviews
export const getBarberReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const reviews = await Review.findAll({
    where: { BarberId: id, IsActive: true },
    include: [
      {
        model: User,
        as: 'Client',
        include: [{ model: UserProfile, as: 'UserProfile' }],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  const data = reviews.map((r) => ({
    id: r.Id,
    rating: r.Rating,
    comment: r.Comment,
    createdAt: r.CreatedAt,
    client: {
      id: r.Client?.Id,
      name: r.Client?.Name,
      profilePicture: r.Client?.UserProfile?.Imagen
        ? getFullImageUrl(r.Client.UserProfile.Imagen)
        : getFullImageUrl(getDefaultAvatarPath()),
    },
  }));

  return res.status(200).json({ success: true, data });
});

// POST /api/v1/barbers/:id/reviews - Auth client creates review
export const createReview = [
  validateJWT,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const clientId = req.userId;
    const { rating, comment } = req.body || {};

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'rating debe ser un número entre 1 y 5',
      });
    }

    const barber = await User.findByPk(id, {
      include: [
        {
          model: UserRole,
          as: 'UserRoles',
          include: [{ model: Role, as: 'Role' }],
        },
      ],
    });

    if (!barber || !barber.IsActive) {
      return res.status(404).json({ success: false, message: 'Barbero no encontrado' });
    }

    const hasEmployeeRole = barber.UserRoles?.some(
      (ur) => ur.Role?.Name === EMPLOYEE_ROLE
    );
    if (!hasEmployeeRole) {
      return res.status(404).json({ success: false, message: 'Barbero no encontrado' });
    }

    const existingReview = await Review.findOne({
      where: { BarberId: id, ClientId: clientId, IsActive: true },
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'Ya has escrito una reseña para este barbero',
      });
    }

    const review = await Review.create({
      BarberId: id,
      ClientId: clientId,
      Rating: rating,
      Comment: comment || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Reseña creada exitosamente',
      data: {
        id: review.Id,
        rating: review.Rating,
        comment: review.Comment,
        createdAt: review.CreatedAt,
      },
    });
  }),
];

// GET /api/v1/barbers/admin/all - Admin list all barbers with details
export const getAdminBarbers = [
  validateJWT,
  asyncHandler(async (req, res) => {
    if (!(await ensureAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const employeeRole = await Role.findOne({ where: { Name: EMPLOYEE_ROLE } });
    if (!employeeRole) {
      return res.status(200).json({ success: true, data: [] });
    }

    const barbers = await User.findAll({
      include: [
        { model: UserProfile, as: 'UserProfile' },
        { model: UserEmail, as: 'UserEmail' },
        {
          model: UserRole,
          as: 'UserRoles',
          where: { RoleId: employeeRole.Id },
          include: [{ model: Role, as: 'Role' }],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const result = await Promise.all(
      barbers.map(async (barber) => {
        const schedule = await getScheduleForBarber(barber.Id);
        const reviewStats = await getReviewStats(barber.Id);
        return {
          ...buildBarberResponse(barber, schedule, reviewStats),
          email: barber.Email,
          emailVerified: barber.UserEmail?.EmailVerified || false,
          createdAt: barber.CreatedAt,
          updatedAt: barber.UpdatedAt,
        };
      })
    );

    return res.status(200).json({ success: true, data: result });
  }),
];
