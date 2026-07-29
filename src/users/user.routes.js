import { Router } from 'express';
import {
  updateUserRole,
  getUserRoles,
  getUsersByRole,
  createEmployee,
  updateProfile,
} from './user.controller.js';

import { validateJWT } from '../../middlewares/validate-JWT.js';
import { findUserById } from '../../helpers/user-db.js';
import { User } from './user.model.js';
import { UserProfile, UserEmail } from './user.model.js';
import { UserRole, Role } from '../auth/role.model.js';
import { ADMIN_ROLE } from '../../helpers/role-constants.js';

const router = Router();

// POST /api/v1/users/employee
/**
 * @swagger
 * /api/v1/users/employee:
 *   post:
 *     tags: [Users]
 *     summary: Create employee user
 *     description: Create a new employee user (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, phone]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Email already exists
 */
router.post('/employee', ...createEmployee);

// PUT /api/v1/users/:userId/role
/**
 * @swagger
 * /api/v1/users/{userId}/role:
 *   put:
 *     tags: [Users]
 *     summary: Update user role
 *     description: Assign a single role to a user (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleName]
 *             properties:
 *               roleName:
 *                 type: string
 *                 example: ADMIN_ROLE
 *     responses:
 *       200:
 *         description: Role updated
 *       400:
 *         description: Role not allowed
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put('/:userId/role', ...updateUserRole);

// GET /api/v1/users/:userId/roles
/**
 * @swagger
 * /api/v1/users/{userId}/roles:
 *   get:
 *     tags: [Users]
 *     summary: Get roles by user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role list
 *       401:
 *         description: Unauthorized
 */
router.get('/:userId/roles', ...getUserRoles);

// GET /api/v1/users/by-role/:roleName
/**
 * @swagger
 * /api/v1/users/by-role/{roleName}:
 *   get:
 *     tags: [Users]
 *     summary: Get users by role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: roleName
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: ADMIN_ROLE
 *     responses:
 *       200:
 *         description: Users by role
 *       400:
 *         description: Role not allowed
 *       403:
 *         description: Forbidden
 */
router.get('/by-role/:roleName', ...getUsersByRole);

// GET /api/v1/users/all
/**
 * @swagger
 * /api/v1/users/all:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list
 *       403:
 *         description: Forbidden
 */
router.get('/all', validateJWT, async (req, res) => {
  // Verificar que el usuario sea admin
  const user = req.user;
  const roles = user.UserRoles?.map((ur) => ur.Role?.Name) || [];
  if (!roles.includes(ADMIN_ROLE)) {
    return res.status(403).json({ success: false, message: 'Acceso restringido solo para administradores.' });
  }

  // Obtener todos los usuarios con relaciones
  const users = await User.findAll({
    include: [
      { model: UserProfile, as: 'UserProfile' },
      { model: UserEmail, as: 'UserEmail' },
      {
        model: UserRole,
        as: 'UserRoles',
        include: [{ model: Role, as: 'Role' }],
      },
    ],
  });

  return res.status(200).json({ success: true, users });
});

// PUT /api/v1/users/profile
/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Update own profile (name, phone, profilePicture)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone]
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', ...updateProfile);

export default router;
