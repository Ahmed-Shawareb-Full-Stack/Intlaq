import { Request, Response } from 'express';
import pool from '../utils/db';
import { AuthRequest } from '../middleware/auth';

export const searchJobs = async (req: AuthRequest, res: Response) => {
  const {
    languages,
    experience_level,
    location,
    keywords,
    page = 1,
    limit = 10,
  } = req.query;
  const userType = req.user?.type;

  if (userType !== 'EMPLOYEE') {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    const offset = (Number(page) - 1) * Number(limit);
    let query = `
      SELECT jp.*, e.company_name, c.name AS city_name
      FROM job_posting jp
      JOIN employers e ON jp.employer_id = e.employer_id
      JOIN city c ON jp.city_id = c.city_id
      WHERE 1=1
    `;
    const values: any[] = [];

    if (languages) {
      const langs = (languages as string).split(',');
      query += ` AND jp.job_id IN (
        SELECT job_id FROM job_posting_programming_language jpl
        JOIN programming_languages pl ON jpl.language_id = pl.language_id
        WHERE pl.name = ANY($${values.length + 1}::text[])
      )`;
      values.push(langs);
    }

    if (experience_level) {
      query += ` AND jp.required_experience = $${values.length + 1}`;
      values.push(experience_level);
    }

    if (location) {
      query += ` AND c.name ILIKE $${values.length + 1}`;
      values.push(`%${location}%`);
    }

    if (keywords) {
      query += ` AND jp.job_description ILIKE $${values.length + 1}`;
      values.push(`%${keywords}%`);
    }

    query += ` ORDER BY jp.job_id DESC LIMIT $${values.length + 1} OFFSET $${
      values.length + 2
    }`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
    return;
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
};
