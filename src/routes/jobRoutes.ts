import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { searchJobs } from '../controllers/job.controller';

const router = express.Router();

router.get('/search', authenticateJWT, authorizeRoles('EMPLOYEE'), searchJobs);

export default router;
