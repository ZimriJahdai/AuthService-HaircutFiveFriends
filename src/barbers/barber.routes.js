import { Router } from 'express';
import {
  createBarber,
  updateBarber,
  updateBarberSchedule,
  toggleBarberActive,
  listBarbers,
  getBarberById,
  getBarberReviews,
  createReview,
  getAdminBarbers,
} from './barber.controller.js';

const router = Router();

// Admin endpoints
router.post('/', ...createBarber);
router.put('/:id', ...updateBarber);
router.put('/:id/schedule', ...updateBarberSchedule);
router.patch('/:id/toggle-active', ...toggleBarberActive);
router.get('/admin/all', ...getAdminBarbers);

// Public endpoints
router.get('/', listBarbers);
router.get('/:id', getBarberById);
router.get('/:id/reviews', getBarberReviews);
router.post('/:id/reviews', ...createReview);

export default router;
