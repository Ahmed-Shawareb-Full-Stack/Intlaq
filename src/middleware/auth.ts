import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../utils/db';
import { User } from '../models/user';
import { log } from 'console';

dotenv.config();

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.sendStatus(403).json({ message: 'Unauthorized' });
    return;
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    async (err, data: any) => {
      log(data);
      if (err) {
        res.sendStatus(403).json({ message: 'Unauthorized' });
        return;
      }
      const userResult = await pool.query(
        'SELECT * FROM "user" WHERE user_id = $1',
        [data?.user_id]
      );
      const user = userResult.rows[0];

      if (!user) {
        res.status(400).json({ message: 'Invalid credentials' });
        return;
      }
      req.user = user;
      next();
    }
  );
};

export const authorizeRoles = (...roles: ('EMPLOYER' | 'EMPLOYEE')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.type)) {
      res.sendStatus(403);
      return;
    }
    next();
  };
};
