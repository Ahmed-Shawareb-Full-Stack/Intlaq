import { Request, Response, NextFunction } from 'express';
import { registrationSchema } from '../joi-schema/register.schema';
import { createEmployerSchema } from '../joi-schema/create-employer.schema';

export const validateCreateEmployer = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = createEmployerSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }
  next();
};
