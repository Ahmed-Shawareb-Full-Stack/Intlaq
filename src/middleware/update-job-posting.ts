import { Request, Response, NextFunction } from 'express';
import { updateJobPostSchema } from '../joi-schema/update-jop-post.schema';

export const validateJobUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = updateJobPostSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }
  next();
};
