import { Role } from '../src/auth/role.model.js';
import { User, UserProfile, UserEmail } from '../src/users/user.model.js';
import { UserRole } from '../src/auth/role.model.js';
import { USER_ROLE, ADMIN_ROLE, EMPLOYEE_ROLE } from './role-constants.js';
import { generateUserId } from './uuid-generator.js';
import { hashPassword } from '../utils/password-utils.js';

export const seedData = async () => {
  // Crear roles si no existen
  const roles = [ADMIN_ROLE, USER_ROLE, EMPLOYEE_ROLE];
  for (const name of roles) {
    await Role.findOrCreate({
      where: { Name: name },
      defaults: { Id: generateUserId(), Name: name },
    });
  }

  // Crear usuario admin si no existe
  const adminExists = await User.findOne({ where: { Email: 'admin@gestor.local' } });
  if (!adminExists) {
    const adminRole = await Role.findOne({ where: { Name: ADMIN_ROLE } });
    if (adminRole) {
      const userId = generateUserId();
      const profileId = generateUserId();
      const emailId = generateUserId();
      const userRoleId = generateUserId();
      const password = await hashPassword('Admin1234!');

      // Crear usuario admin
      await User.create({
        Id: userId,
        Name: 'Admin',
        Email: 'admin@gestor.local',
        Password: password,
        IsActive: true,
      });

      await UserProfile.create({
        Id: profileId,
        UserId: userId,
        Imagen: '',
        Phone: '39539423',
      });

      await UserEmail.create({
        Id: emailId,
        UserId: userId,
        EmailVerified: true,
        EmailVerificationToken: null,
        EmailVerificationTokenExpiry: null,
      });

      await UserRole.create({
        Id: userRoleId,
        UserId: userId,
        RoleId: adminRole.Id,
      });
    }
  }

  // Crear cliente demo si no existe
  const clientExists = await User.findOne({ where: { Email: 'cliente@demo.com' } });
  if (!clientExists) {
    const userRole = await Role.findOne({ where: { Name: USER_ROLE } });
    if (userRole) {
      const clientUserId = 'usr_c1ientDemo12'; // Vinculado al id del cliente en MongoDB
      const profileId = generateUserId();
      const emailId = generateUserId();
      const userRoleId = generateUserId();
      const clientPassword = await hashPassword('Cliente1234!');

      await User.create({
        Id: clientUserId,
        Name: 'Cliente Demo',
        Email: 'cliente@demo.com',
        Password: clientPassword,
        IsActive: true,
      });

      await UserProfile.create({
        Id: profileId,
        UserId: clientUserId,
        Imagen: '',
        Phone: '55559999',
      });

      await UserEmail.create({
        Id: emailId,
        UserId: clientUserId,
        EmailVerified: true,
        EmailVerificationToken: null,
        EmailVerificationTokenExpiry: null,
      });

      await UserRole.create({
        Id: userRoleId,
        UserId: clientUserId,
        RoleId: userRole.Id,
      });
    }
  }
};
