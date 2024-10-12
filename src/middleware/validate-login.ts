import { Request, Response, NextFunction } from 'express';
import { loginSchema } from '../joi-schema/login.schema';

export const validateRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }
  next();
};
