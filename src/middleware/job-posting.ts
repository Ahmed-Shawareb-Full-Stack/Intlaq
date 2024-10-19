import { Request, Response, NextFunction } from 'express';
import { jobPostSchema } from '../joi-schema/job-posting.schema';

export const validateJobPost = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = jobPostSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }
  next();
};
