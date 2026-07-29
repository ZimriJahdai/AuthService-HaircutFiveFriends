import { Op } from 'sequelize';
import { SignupRequest } from '../src/auth/signup-request.model.js';
import { checkUserExists, createNewUser } from './user-db.js';
import { hashPassword } from '../utils/password-utils.js';
import { generateEmailVerificationToken } from '../utils/auth-helpers.js';
import { updateEmailVerificationToken } from './user-db.js';
import { sendVerificationEmail } from './email-service.js';

export const createSignupRequest = async ({
  name,
  email,
  password,
  phone,
  profilePicture,
}) => {
  const normalizedEmail = email.toLowerCase();

  if (await checkUserExists(normalizedEmail)) {
    const err = new Error('Ya existe un usuario con este email');
    err.status = 409;
    throw err;
  }

  const existingPending = await SignupRequest.findOne({
    where: { Email: normalizedEmail, Status: 'PENDING' },
  });
  if (existingPending) {
    const err = new Error('Ya existe una solicitud pendiente para este email');
    err.status = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);

  const request = await SignupRequest.create({
    Name: name,
    Email: normalizedEmail,
    PasswordHash: passwordHash,
    Phone: phone,
    ProfilePicture: profilePicture || null,
    Status: 'PENDING',
  });

  return request;
};

export const listSignupRequests = async ({ status = 'PENDING' } = {}) => {
  const whereClause = status ? { Status: status } : {};
  return SignupRequest.findAll({
    where: whereClause,
    order: [['created_at', 'ASC']],
    attributes: { exclude: ['PasswordHash'] },
  });
};

export const getSignupRequestById = async (id) => {
  return SignupRequest.findByPk(id);
};

export const approveSignupRequest = async (id, approverId) => {
  const request = await SignupRequest.findByPk(id);
  if (!request) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }

  if (request.Status !== 'PENDING') {
    const err = new Error('La solicitud ya fue procesada');
    err.status = 400;
    throw err;
  }

  if (await checkUserExists(request.Email)) {
    const err = new Error('Ya existe un usuario con este email');
    err.status = 409;
    throw err;
  }

  // Crear el usuario usando la contraseña ya hasheada
  const user = await createNewUser({
    name: request.Name,
    email: request.Email,
    phone: request.Phone,
    profilePicture: request.ProfilePicture,
    hashedPassword: request.PasswordHash,
  });

  // Generar token de verificación y asignarlo al usuario recién creado
  const verificationToken = await generateEmailVerificationToken();
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await updateEmailVerificationToken(user.Id, verificationToken, tokenExpiry);

  // Marcar la solicitud como aprobada
  request.Status = 'APPROVED';
  request.ApprovedBy = approverId || null;
  request.ApprovedAt = new Date();
  await request.save();

  // Enviar email con el token de verificación
  try {
    await sendVerificationEmail(user.Email, user.Name, verificationToken);
  } catch (err) {
    // No romper el flujo si el correo falla; el token sigue siendo válido
    console.error('Error enviando email de verificación tras aprobar solicitud:', err);
  }

  return { user, verificationToken };
};

export const rejectSignupRequest = async (id, approverId) => {
  const request = await SignupRequest.findByPk(id);
  if (!request) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }

  if (request.Status !== 'PENDING') {
    const err = new Error('La solicitud ya fue procesada');
    err.status = 400;
    throw err;
  }

  request.Status = 'REJECTED';
  request.ApprovedBy = approverId || null;
  request.ApprovedAt = new Date();
  await request.save();
  return request;
};
