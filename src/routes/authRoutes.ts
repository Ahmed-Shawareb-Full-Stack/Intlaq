import express from 'express';
import { validateRegistration } from '../middleware/validate-registration';
import {
  createEmployer,
  loginEmployee,
  loginEmployer,
  registerEmployee,
} from '../controllers/auth.controller';
import { validateCreateEmployer } from '../middleware/validate-create-employer';

const router = express.Router();

router.post('/register', validateRegistration, registerEmployee);

router.post('/create-employer', validateCreateEmployer, createEmployer);

router.post('/login', loginEmployee);

router.post('/login-employer', loginEmployer);

export default router;
