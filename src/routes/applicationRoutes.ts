import express from 'express';
import {
  applyForJob,
  listEmployeeApplications,
  listJobApplications,
  manageApplication,
} from '../controllers/application.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = express.Router();

router.post(
  '/apply/:job_id',
  authenticateJWT,
  authorizeRoles('EMPLOYEE'),
  applyForJob
);

router.put(
  '/manage/:application_id',
  authenticateJWT,
  authorizeRoles('EMPLOYER'),
  manageApplication
);

router.get(
  '/:job_id',
  authenticateJWT,
  authorizeRoles('EMPLOYER'),
  listJobApplications
);

router.get(
  '/',
  authenticateJWT,
  authorizeRoles('EMPLOYEE'),
  listEmployeeApplications
);

export default router;
