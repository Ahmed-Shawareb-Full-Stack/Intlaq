import Joi from 'joi';

export const updateJobPostSchema = Joi.object({
  job_title: Joi.string().max(100).optional(),
  job_description: Joi.string().optional(),
  city_id: Joi.number().integer().optional(),
  required_experience: Joi.string().valid('Junior', 'Mid', 'Senior').optional(),
  programming_languages: Joi.array().items(Joi.number()).optional(),
}).min(1);
