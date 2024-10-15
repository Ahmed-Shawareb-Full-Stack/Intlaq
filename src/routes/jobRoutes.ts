import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { searchJobs } from '../controllers/job.controller';
import { getProfile } from '../controllers/profile.controller';

const router = express.Router();

router.get('/search', authenticateJWT, authorizeRoles('EMPLOYEE'), searchJobs);
router.get(
  '/:employee_id',
  authenticateJWT,
  authorizeRoles('EMPLOYEE', 'EMPLOYER'),
  getProfile
);

export default router;
