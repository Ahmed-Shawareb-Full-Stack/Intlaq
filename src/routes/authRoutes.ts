import express from 'express';
import { validateRegistration } from '../middleware/validate-registration';
import {
  loginEmployee,
  registerEmployee,
} from '../controllers/auth.controller';

const router = express.Router();

router.post('/register', validateRegistration, registerEmployee);
router.post('/login', loginEmployee);

export default router;
