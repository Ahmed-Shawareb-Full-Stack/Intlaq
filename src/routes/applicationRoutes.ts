import express from 'express';
import {
  applyForJob,
  getProgrammingLanguages,
  listEmployeeApplications,
  listJobApplications,
  manageApplication,
} from '../controllers/application.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = express.Router();

router.get('/languages', getProgrammingLanguages);

router.post(
  '/apply/:job_id',
  authenticateJWT,
  authorizeRoles('EMPLOYEE'),
  applyForJob
);

router.post(
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
