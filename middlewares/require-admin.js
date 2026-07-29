import { ADMIN_ROLE } from '../helpers/role-constants.js';

// Simple guard to ensure the authenticated user has ADMIN_ROLE
export const requireAdmin = (req, res, next) => {
  const roles = req.user?.UserRoles?.map((ur) => ur.Role?.Name) || [];
  if (!roles.includes(ADMIN_ROLE)) {
    return res.status(403).json({
      success: false,
      message: 'Acceso restringido solo para administradores.',
    });
  }
  next();
};
