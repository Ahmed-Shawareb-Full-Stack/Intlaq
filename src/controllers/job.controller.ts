import { Response } from 'express';
import client from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import pool from '../utils/db';
import { log } from 'console';

export interface Job {
  job_posting_id: string;
  job_title: string;
  job_description: string;
  city_id: number;
  city_name: string;
  required_experience: string;
  created_at: Date;
  employer_id: string;
  company_name: string;
  contact_email: string;
  user_id: string;
  id: number;
  programming_language_id: number;
  language_id: number;
  name: string;
  programming_language: [
    {
      language_id: number;
      name: string;
    }
  ];
}
export const listAllJobs = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  if (user?.type !== 'EMPLOYEE') {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    const employeeResult = await pool.query(
      'SELECT * FROM employee WHERE user_id = $1',
      [user.user_id]
    );

    if (employeeResult.rows.length === 0) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    const jobsResult = await pool.query(
      `SELECT jp.job_posting_id, jp.job_title, jp.job_description, jp.city_id, c.name AS city_name, jp.required_experience, jp.created_at, e.*, jpl.*, pl.*
       FROM job_posting jp
       JOIN city c ON jp.city_id = c.city_id
       JOIN employer e ON jp.employer_id = e.employer_id
       JOIN job_posting_programming_language jpl ON jp.job_posting_id = jpl.job_posting_id
       JOIN programming_languages pl ON jpl.programming_language_id = pl.language_id
       JOIN LATERAL (
         SELECT COUNT(*) AS language_matches
         FROM job_posting_programming_language jpl
         JOIN employee_languages el ON jpl.programming_language_id = el.language_id
         WHERE jpl.job_posting_id = jp.job_posting_id
         AND el.employee_id = $1
       ) language_matches ON TRUE
       JOIN LATERAL (
         SELECT COUNT(*) AS city_matches
         FROM address a
         WHERE a.employee_id = $1
         AND a.city_id = jp.city_id
       ) city_matches ON TRUE
       ORDER BY language_matches DESC, city_matches DESC, jp.created_at DESC
       LIMIt $2 OFFSET $3`,
      [user?.user_id, limit, offset]
    );

    const jobs: Partial<Job>[] = [];

    jobsResult.rows.forEach((job) => {
      if (jobs.some((j) => j.job_posting_id === job.job_posting_id)) {
        const index = jobs.findIndex(
          (j) => j.job_posting_id === job.job_posting_id
        );

        if (index !== -1) {
          jobs[index].programming_language?.push({
            language_id: job.language_id,
            name: job.name,
          });
          return;
        }
      }
      jobs.push({
        ...job,
        programming_language: [
          {
            language_id: job.language_id,
            name: job.name,
          },
        ],
      });
    });

    const mappedResult = jobs.map(async (job) => {
      const jobApplied = await pool.query(
        'SELECT * FROM application WHERE job_posting_id = $1 AND employee_id = $2',
        [job.job_posting_id, employeeResult.rows[0]?.employee_id]
      );
      return {
        ...job,
        applied: jobApplied.rows.length > 0,
      };
    });

    res.status(200).json({
      jobs: await Promise.all(mappedResult),
    });
  } catch (error) {
    console.error('Error listing all jobs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const searchJobs = async (req: AuthRequest, res: Response) => {
  const {
    languages,
    experience_level,
    city,
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
      JOIN employer e ON jp.employer_id = e.employer_id
      JOIN city c ON jp.city_id = c.city_id
      WHERE 1=1
    `;
    const values: any[] = [];

    if (languages) {
      const langs = (languages as string).split(',');
      query += ` AND jp.job_posting_id IN (
        SELECT job_posting_id FROM "job_posting_programming_language" jpl
        JOIN programming_languages pl ON jpl.programming_language_id = pl.language_id
        WHERE pl.language_id = ANY($${values.length + 1}::INT[])
      )`;
      values.push(langs);
    }

    if (experience_level) {
      query += ` AND jp.required_experience = $${values.length + 1}`;
      values.push(experience_level);
    }

    if (city) {
      query += ` AND c.city_id = $${values.length + 1}`;
      values.push(city);
    }

    if (keywords) {
      query += ` AND jp.job_description ILIKE $${values.length + 1}`;
      values.push(`%${keywords}%`);
    }

    query += ` ORDER BY jp.job_posting_id DESC LIMIT $${
      values.length + 1
    } OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await client.query(query, values);

    res.status(200).json(result.rows);
    return;
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
};

export const postJob = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();

  const {
    job_title,
    job_description,
    city_id,
    required_experience,
    programming_languages,
  } = req.body;

  const user = req.user;

  if (
    !['JUNIOR', 'MID-SENIOR', 'SENIOR', 'TEAM-LEAD'].includes(
      required_experience
    )
  ) {
    res.status(400).json({ message: 'Invalid experience level' });
    return;
  }

  if (user?.type !== 'EMPLOYER') {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const cityResult = await client.query(
      'SELECT city_id FROM city WHERE city_id = $1',
      [city_id]
    );
    let cityId = cityResult.rows[0]?.city_id;

    if (!cityId) {
      res.status(400).json({ message: 'City not found' });
      return;
    }

    const languageCheckResult = await client.query(
      'SELECT COUNT(language_id) FROM programming_languages WHERE language_id IN (SELECT unnest($1::int[]))',
      [programming_languages]
    );

    const existingLanguagesCount = parseInt(languageCheckResult.rows[0].count);

    if (existingLanguagesCount !== programming_languages.length) {
      res.status(400).json({
        message: 'One or more programming languages do not exist',
      });
      return;
    }

    const employerResult = await client.query(
      'SELECT employer_id FROM employer WHERE user_id = $1',
      [user.user_id]
    );

    if (employerResult.rows.length === 0) {
      res.status(404).json({ message: 'Employer profile not found' });
      return;
    }

    const employer_id = employerResult.rows[0].employer_id;

    const insertResult = await client.query(
      `INSERT INTO job_posting (employer_id, job_title, job_description, city_id, required_experience)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING job_posting_id, job_title, job_description, city_id, required_experience, created_at`,
      [employer_id, job_title, job_description, city_id, required_experience]
    );

    const jobId = insertResult.rows[0].job_posting_id;

    for (const language_id of programming_languages) {
      await client.query(
        'INSERT INTO "job_posting_programming_language"(job_posting_id, programming_language_id) VALUES($1, $2) ON CONFLICT DO NOTHING',
        [jobId, language_id]
      );
    }

    res.status(201).json({
      message: 'Job posted successfully',
      job: insertResult.rows[0],
    });
  } catch (error) {
    console.error('Error posting job:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateJobPosting = async (req: AuthRequest, res: Response) => {
  const { job_id } = req.params;
  const { job_title, job_description, city_id, required_experience } = req.body;
  const user = req.user;

  if (user?.type !== 'EMPLOYER') {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const jobResult = await pool.query(
      `SELECT jp.*, e.employer_id 
       FROM job_posting jp 
       JOIN employer e ON jp.employer_id = e.employer_id 
       WHERE jp.job_posting_id = $1 AND e.user_id = $2`,
      [job_id, user?.user_id]
    );

    if (jobResult.rows.length === 0) {
      res.status(404).json({ message: 'Job posting not found' });
      return;
    }

    const employer_id = jobResult.rows[0].employer_id;

    const employerResult = await pool.query(
      'SELECT employer_id FROM employer WHERE user_id = $1',
      [user?.user_id]
    );

    if (
      employerResult.rows.length === 0 ||
      employerResult.rows[0].employer_id !== employer_id
    ) {
      res
        .status(403)
        .json({ message: 'Not authorized to update this job posting' });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (job_title) {
      fields.push(`job_title = $${index++}`);
      values.push(job_title);
    }
    if (job_description) {
      fields.push(`job_description = $${index++}`);
      values.push(job_description);
    }
    if (city_id) {
      fields.push(`city_id = $${index++}`);
      values.push(city_id);
    }
    if (required_experience) {
      fields.push(`required_experience = $${index++}`);
      values.push(required_experience);
    }

    values.push(job_id);

    const updateQuery = `
      UPDATE job_posting
      SET ${fields.join(', ')}
      WHERE job_posting_id = $${index}
      RETURNING job_posting_id, job_title, job_description, city_id, required_experience, updated_at
    `;

    const updateResult = await pool.query(updateQuery, values);

    res.status(200).json({
      message: 'Job posting updated successfully',
      job: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error updating job posting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEmployerJobs = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    const employerResult = await pool.query(
      'SELECT employer_id FROM employer WHERE user_id = $1',
      [user_id]
    );
    const employer_id = employerResult.rows[0].employer_id;

    const jobsResult = await pool.query(
      'SELECT jp.job_posting_id, jp.job_title, jp.job_description, jp.city_id, c.name AS city_name, jp.required_experience, jp.created_at, e.company_name AS employer_name ' +
        'FROM job_posting jp ' +
        'JOIN employer e ON jp.employer_id = e.employer_id ' +
        'JOIN city c ON jp.city_id = c.city_id ' +
        'WHERE jp.employer_id = $1 ' +
        'ORDER BY jp.created_at DESC',
      [employer_id]
    );

    res.status(200).json({
      message: 'Jobs posted by employer fetched successfully',
      jobs: jobsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching jobs posted by employer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getJobById = async (req: AuthRequest, res: Response) => {
  const { job_posting_id } = req.params;

  try {
    const employeeResult = await pool.query(
      'SELECT * FROM employee WHERE user_id = $1',
      [req.user?.user_id]
    );
    const employee = employeeResult.rows[0];

    if (!employee) {
      res.status(400).json({ message: 'Employee not found' });
      return;
    }
    const jobResult = await pool.query(
      `SELECT jp.*, c.name AS city_name, e.company_name 
       FROM job_posting jp
       JOIN city c ON jp.city_id = c.city_id
       JOIN employer e ON jp.employer_id = e.employer_id
       WHERE jp.job_posting_id = $1`,
      [job_posting_id]
    );

    if (jobResult.rows.length === 0) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    const job = jobResult.rows[0];

    const applicationResult = await pool.query(
      'SELECT * FROM application WHERE job_posting_id = $1 AND employee_id = $2',
      [job_posting_id, employee.employee_id]
    );

    job.applied = applicationResult.rows.length > 0;
    job.applicationStatus = applicationResult.rows[0]?.status;

    res.status(200).json({
      message: 'Job fetched successfully',
      job: job,
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
