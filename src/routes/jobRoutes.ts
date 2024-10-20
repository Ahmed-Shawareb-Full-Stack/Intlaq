import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import {
  getEmployerJobs,
  getJobById,
  listAllJobs,
  postJob,
  searchJobs,
  updateJobPosting,
} from '../controllers/job.controller';
import { validateJobPost } from '../middleware/job-posting';
import { validateJobUpdate } from '../middleware/update-job-posting';

const router = express.Router();

router.get('/search', authenticateJWT, authorizeRoles('EMPLOYEE'), searchJobs);

router.get(
  '/jobs-posted',
  authenticateJWT,
  authorizeRoles('EMPLOYER'),
  getEmployerJobs
);

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('EMPLOYER'),
  validateJobPost,
  postJob
);

router.put(
  '/:job_id',
  authenticateJWT,
  authorizeRoles('EMPLOYER'),
  validateJobUpdate,
  updateJobPosting
);

router.get('/', authenticateJWT, authorizeRoles('EMPLOYEE'), listAllJobs);

router.get(
  '/:job_posting_id',
  authenticateJWT,
  authorizeRoles('EMPLOYEE'),
  getJobById
);

export default router;
