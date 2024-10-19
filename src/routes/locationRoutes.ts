import express, { Request, Response } from 'express';
import {
  getStates,
  getCountries,
  getCities,
} from '../controllers/location.controller';

const router = express.Router();

router.get('/states', getStates);
router.get('/countries', getCountries);
router.get('/cities', getCities);

export default router;
