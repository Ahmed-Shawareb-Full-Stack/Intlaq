import { Request, Response, NextFunction } from 'express';
import { registrationSchema } from '../joi-schema/register.schema';

export const validateRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = registrationSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }
  next();
};
