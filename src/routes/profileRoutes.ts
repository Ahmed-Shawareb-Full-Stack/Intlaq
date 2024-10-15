import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { getProfile, searchProfiles } from '../controllers/profile.controller';

const router = express.Router();
router.get(
  '/:employee_id',
  authenticateJWT,
  authorizeRoles('EMPLOYEE', 'EMPLOYER'),
  getProfile
);
router.get(
  '/search',
  authenticateJWT,
  authorizeRoles('EMPLOYER'),
  searchProfiles
);

export default router;
