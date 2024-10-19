import Joi from 'joi';

export const createEmployerSchema = Joi.object({
  name: Joi.string().max(100).required(),
  contactEmail: Joi.string().max(100).required(),
  companyName: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});
