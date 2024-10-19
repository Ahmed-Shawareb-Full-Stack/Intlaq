import Joi from 'joi';

export const registrationSchema = Joi.object({
  national_id: Joi.string().min(14).max(50).required(),
  name: Joi.string().max(100).required(),
  address: Joi.object({
    country_id: Joi.number().required(),
    state_id: Joi.number().required(),
    city_id: Joi.number().required(),
    details: Joi.string().optional(),
  }).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  bio: Joi.string().optional(),
  experience_level: Joi.string()
    .valid('JUNIOR', 'MID-SENIOR', 'SENIOR', 'TEAM-LEAD')
    .required(),
  programming_languages: Joi.array().items(Joi.number()).required(),
});
