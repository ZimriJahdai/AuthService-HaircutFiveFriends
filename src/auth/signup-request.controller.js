import { asyncHandler } from '../../middlewares/server-genericError-handler.js';
import {
  approveSignupRequest,
  createSignupRequest,
  listSignupRequests,
} from '../../helpers/signup-request-db.js';

export const submitSignupRequest = asyncHandler(async (req, res) => {
  const { name, email, password, phone, profilePicture } = req.body || {};

  const request = await createSignupRequest({
    name,
    email,
    password,
    phone,
    profilePicture,
  });

  return res.status(201).json({
    success: true,
    message:
      'Solicitud creada. Un administrador debe aprobarla antes de que puedas verificar tu email.',
    data: {
      id: request.Id,
      status: request.Status,
      email: request.Email,
    },
  });
});

export const listPendingRequests = asyncHandler(async (req, res) => {
  const requests = await listSignupRequests({ status: 'PENDING' });
  return res.status(200).json({
    success: true,
    data: requests,
  });
});

export const approveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: approverId } = req;

  const { verificationToken } = await approveSignupRequest(id, approverId);

  return res.status(200).json({
    success: true,
    message:
      'Solicitud aprobada. Se envió un token de verificación al correo del solicitante.',
    data: {
      verificationToken,
    },
  });
});
