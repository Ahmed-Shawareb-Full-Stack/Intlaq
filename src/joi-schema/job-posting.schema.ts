import Joi from 'joi';

export const jobPostSchema = Joi.object({
  job_title: Joi.string().max(100).required(),
  job_description: Joi.string().required(),
  city_id: Joi.number().integer().required(),
  required_experience: Joi.string()
    .valid('JUNIOR', 'MID-SENIOR', 'SENIOR', 'TEAM-LEAD')
    .required(),
  programming_languages: Joi.array().items(Joi.number()).required(),
});
