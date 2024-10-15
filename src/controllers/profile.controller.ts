import { Request, Response } from 'express';
import pool from '../utils/db';
import { AuthRequest } from '../middleware/auth';

export const searchProfiles = async (req: AuthRequest, res: Response) => {
  const {
    languages,
    experience_level,
    location,
    keywords,
    page = 1,
    limit = 10,
  } = req.query;
  const userType = req.user?.type;

  if (userType !== 'EMPLOYER') {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    const offset = (Number(page) - 1) * Number(limit);
    let query = `
      SELECT emp.*, addr.details, c.name as city, s.name as state, co.name as country
      FROM employees emp
      JOIN address addr ON emp.address_id = addr.address_id
      JOIN city c ON addr.city_id = c.city_id
      JOIN state s ON c.state_id = s.state_id
      JOIN country co ON s.country_id = co.country_id
      WHERE 1=1
    `;
    const values: any[] = [];

    if (languages) {
      const langs = (languages as string).split(',');
      query += `
        AND emp.employee_id IN (
          SELECT el.employee_id
          FROM employee_languages el
          JOIN programming_languages pl ON el.language_id = pl.language_id
          WHERE pl.name = ANY($${values.length + 1}::text[])
        )
      `;
      values.push(langs);
    }

    if (experience_level) {
      query += ` AND emp.experience_level = $${values.length + 1}`;
      values.push(experience_level);
    }

    if (location) {
      query += ` AND (c.name ILIKE $${values.length + 1} OR s.name ILIKE $${
        values.length + 1
      } OR co.name ILIKE $${values.length + 1})`;
      values.push(`%${location}%`);
    }

    if (keywords) {
      query += ` AND emp.bio ILIKE $${values.length + 1}`;
      values.push(`%${keywords}%`);
    }

    if (keywords) {
      query += ` AND similarity(emp.bio, $${values.length + 1}) > 0.3`;
      values.push(keywords);
    }

    query += ` ORDER BY emp.employee_id DESC LIMIT $${
      values.length + 1
    } OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error searching profiles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  const { employee_id } = req.params;
  const userType = req.user?.type;

  if (userType !== 'EMPLOYEE' && userType !== 'EMPLOYER') {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const profileResult = await client.query(
      'SELECT * FROM employees WHERE employee_id = $1',
      [employee_id]
    );
    if (profileResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    if (userType === 'EMPLOYEE') {
      await client.query(
        'UPDATE employees SET profile_views = profile_views + 1 WHERE employee_id = $1',
        [employee_id]
      );
    }

    const profileData = await client.query(
      `SELECT emp.*, addr.details, c.name as city, s.name as state, co.name as country
       FROM employees emp
       JOIN address addr ON emp.address_id = addr.address_id
       JOIN city c ON addr.city_id = c.city_id
       JOIN state s ON c.state_id = s.state_id
       JOIN country co ON s.country_id = co.country_id
       WHERE emp.employee_id = $1`,
      [employee_id]
    );

    await client.query('COMMIT');

    res.status(200).json(profileData.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};
