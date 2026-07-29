import { asyncHandler } from '../../middlewares/server-genericError-handler.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
  checkUserExists,
  createEmployeeUser,
  findUserById,
  updateUserProfile,
} from '../../helpers/user-db.js';
import {
  getUserRoleNames,
  getUsersByRole as repoGetUsersByRole,
  setUserSingleRole,
} from '../../helpers/role-db.js';
import { ALLOWED_ROLES, ADMIN_ROLE } from '../../helpers/role-constants.js';
import { buildUserResponse } from '../../utils/user-helpers.js';
import { sequelize } from '../../configs/db.js';
import { validateCreateEmployee } from '../../middlewares/validation.js';
import { config } from '../../configs/config.js';
import path from 'path';
import crypto from 'crypto';
import { uploadImage } from '../../helpers/cloudinary-service.js';

const ensureAdmin = async (req) => {
  const currentUserId = req.userId;
  if (!currentUserId) return false;
  const roles =
    req.user?.UserRoles?.map((ur) => ur.Role?.Name).filter(Boolean) ??
    (await getUserRoleNames(currentUserId));
  return roles.includes(ADMIN_ROLE);
};

export const createEmployee = [
  validateJWT,
  validateCreateEmployee,
  asyncHandler(async (req, res) => {
    if (!(await ensureAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { name, email, password, phone, profilePicture } = req.body || {};

    const normalizedEmail = (email || '').trim().toLowerCase();
    if (await checkUserExists(normalizedEmail)) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con este email',
      });
    }

    const employee = await createEmployeeUser({
      name,
      email: normalizedEmail,
      password,
      phone,
      profilePicture,
    });

    return res.status(201).json({
      success: true,
      message: 'Empleado creado exitosamente',
      data: buildUserResponse(employee),
      emailVerificationRequired: false,
    });
  }),
];

export const updateUserRole = [
  validateJWT,
  asyncHandler(async (req, res) => {
    if (!(await ensureAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { userId } = req.params;
    const { roleName } = req.body || {};

    const normalized = (roleName || '').trim().toUpperCase();
    if (!ALLOWED_ROLES.includes(normalized)) {
      return res.status(400).json({
        success: false,
        message: 'Role not allowed. Use ADMIN_ROLE, USER_ROLE o EMPLOYEE_ROLE',
      });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const { updatedUser } = await setUserSingleRole(
      user,
      normalized,
      sequelize
    );

    return res.status(200).json(buildUserResponse(updatedUser));
  }),
];

export const updateProfile = [
  validateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { name, phone, profilePicture } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener al menos 2 caracteres',
      });
    }

    if (!phone || !/^\d{8}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono debe tener exactamente 8 dígitos',
      });
    }

    let profilePictureToStore = profilePicture;
    if (profilePicture) {
      const uploadPath = config.upload?.uploadPath || 'uploads/';
      const isLocalFile =
        profilePicture.includes('uploads/') ||
        profilePicture.includes(uploadPath) ||
        profilePicture.startsWith('./') ||
        profilePicture.startsWith('data:image');

      if (isLocalFile) {
        try {
          let ext = path.extname(profilePicture);
          if (profilePicture.startsWith('data:image')) {
            const match = profilePicture.match(/^data:image\/(\w+);base64,/);
            ext = match ? `.${match[1]}` : '.jpg';
          }
          const randomHex = crypto.randomBytes(6).toString('hex');
          const cloudinaryFileName = `profile-${randomHex}${ext}`;

          profilePictureToStore = await uploadImage(
            profilePicture,
            cloudinaryFileName
          );
        } catch (err) {
          console.error(
            'Error uploading profile picture to Cloudinary during profile update:',
            err
          );
          profilePictureToStore = null; // or throw an error depending on desired behavior
        }
      } else {
        profilePictureToStore = profilePicture;
      }
    }

    const updatedUser = await updateUserProfile(userId, { name: name.trim(), phone, profilePicture: profilePictureToStore });

    return res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: buildUserResponse(updatedUser),
    });
  }),
];

export const getUserRoles = [
  validateJWT,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const roles = await getUserRoleNames(userId);
    return res.status(200).json(roles);
  }),
];

export const getUsersByRole = [
  validateJWT,
  asyncHandler(async (req, res) => {
    if (!(await ensureAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { roleName } = req.params;
    const normalized = (roleName || '').trim().toUpperCase();
    if (!ALLOWED_ROLES.includes(normalized)) {
      return res.status(400).json({
        success: false,
        message: 'Role not allowed. Use ADMIN_ROLE, USER_ROLE o EMPLOYEE_ROLE',
      });
    }

    const users = await repoGetUsersByRole(normalized);
    const payload = users.map(buildUserResponse);
    return res.status(200).json(payload);
  }),
];
