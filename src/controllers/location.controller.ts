import pool from '../utils/db';
import { Request, Response } from 'express';

export const getCities = async (req: Request, res: Response) => {
  try {
    const { rows: cities } = await pool.query('SELECT * FROM city');
    res.json(cities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getCountries = async (req: Request, res: Response) => {
  try {
    const { rows: countries } = await pool.query('SELECT * FROM country');
    res.json(countries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getStates = async (req: Request, res: Response) => {
  try {
    const { rows: states } = await pool.query('SELECT * FROM state');
    res.json(states);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
