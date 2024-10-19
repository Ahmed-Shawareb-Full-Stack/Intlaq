import { Request, Response } from 'express';
import pool from '../utils/db';
import { log } from 'console';

interface AuthRequest extends Request {
  user?: {
    user_id: number;
    type: 'EMPLOYER' | 'EMPLOYEE';
    email: string;
  };
}

export const applyForJob = async (req: AuthRequest, res: Response) => {
  const { job_id } = req.params;
  const userType = req.user?.type;

  if (userType !== 'EMPLOYEE') {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  const employee_id = await getEmployeeId(req.user?.user_id);

  if (!employee_id) {
    res.status(404).json({ message: 'Employee profile not found' });
    return;
  }

  try {
    const existing = await pool.query(
      'SELECT * FROM application WHERE job_posting_id = $1 AND employee_id = $2',
      [job_id, employee_id]
    );

    if (existing.rows.length > 0) {
      res.status(400).json({ message: 'Already applied for this job' });
      return;
    }

    await pool.query(
      'INSERT INTO application (job_posting_id, employee_id) VALUES ($1, $2)',
      [job_id, employee_id]
    );

    res.status(201).json({ message: 'Applied for job successfully' });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const manageApplication = async (req: AuthRequest, res: Response) => {
  const { application_id } = req.params;
  const { status } = req.body;
  const userType = req.user?.type;

  if (userType !== 'EMPLOYER') {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  if (!['Accepted', 'Rejected'].includes(status)) {
    res.status(400).json({ message: 'Invalid status' });
    return;
  }

  try {
    const application = await pool.query(
      'SELECT * FROM application WHERE application_id = $1',
      [application_id]
    );

    if (application.rows.length === 0) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const job_id = application.rows[0].job_id;

    const jobResult = await pool.query(
      `SELECT jp.*, e.user_id as employer_user_id 
       FROM job_posting jp 
       JOIN employers e ON jp.employer_id = e.employer_id 
       WHERE jp.job_posting_id = $1`,
      [job_id]
    );

    if (jobResult.rows.length === 0) {
      res.status(404).json({ message: 'Job posting not found' });
      return;
    }

    const employerUserId = jobResult.rows[0].employer_user_id;

    if (employerUserId !== req.user?.user_id) {
      res
        .status(403)
        .json({ message: 'Not authorized to manage this application' });
      return;
    }

    await pool.query(
      'UPDATE application SET status = $1 WHERE application_id = $2',
      [status, application_id]
    );

    res.status(200).json({ message: `Application ${status}` });
  } catch (error) {
    console.error('Error managing application:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const listJobApplications = async (req: AuthRequest, res: Response) => {
  const { job_id } = req.params;
  const user = req.user;

  if (user?.type !== 'EMPLOYER') {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const employerId = await getEmployerId(user?.user_id);
    const jobResult = await pool.query(
      `SELECT jp.*, e.employer_id 
       FROM job_posting jp 
       JOIN employer e ON jp.employer_id = e.employer_id 
       WHERE jp.job_posting_id = $1 AND e.employer_id = $2`,
      [job_id, employerId]
    );

    if (jobResult.rows.length === 0) {
      res.status(404).json({ message: 'Job posting not found' });
      return;
    }

    const applicationsResult = await pool.query(
      `SELECT a.application_id, a.status, a.applied_at, 
              emp.*, 
              pl.*, u.*
       FROM application a
       JOIN employee emp ON a.employee_id = emp.employee_id
       JOIN "user" u ON emp.user_id = u.user_id
       JOIN employee_languages el ON emp.employee_id = el.employee_id
       JOIN programming_languages pl ON el.language_id = pl.language_id
       WHERE a.job_posting_id = $1
       ORDER BY a.applied_at DESC`,
      [job_id]
    );

    const applications: any[] = [];

    applicationsResult.rows.forEach((row) => {
      if (
        applications.some((app) => app.application_id === row.application_id)
      ) {
        const index = applications.findIndex(
          (app) => app.application_id === row.application_id
        );
        if (index !== -1) {
          applications[index].languages.push({
            language_id: row.language_id,
            name: row.name,
          });
          return;
        }
      }

      applications.push({
        ...row,
        languages: [{ language_id: row.language_id, name: row.name }],
      });
    });

    res.status(200).json({
      job_id: job_id,
      applications,
    });
  } catch (error) {
    console.error('Error listing job applications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const listEmployeeApplications = async (
  req: AuthRequest,
  res: Response
) => {
  const user = req.user;

  try {
    const employeeResult = await pool.query(
      'SELECT employee_id FROM employee WHERE user_id = $1',
      [user?.user_id]
    );

    if (employeeResult.rows.length === 0) {
      res.status(404).json({ message: 'Employee profile not found' });
      return;
    }

    const employee_id = employeeResult.rows[0].employee_id;

    const applicationsResult = await pool.query(
      `SELECT a.application_id, a.status, a.applied_at, 
              jp.job_posting_id, jp.job_title, jp.job_description, jp.required_experience, jp.created_at AS job_created_at,
              e.company_name, c.name AS city_name
       FROM application a
       JOIN job_posting jp ON a.job_posting_id = jp.job_posting_id
       JOIN employer emp ON jp.employer_id = emp.employer_id
       JOIN employer e ON emp.employer_id = e.employer_id
       JOIN city c ON jp.city_id = c.city_id
       WHERE a.employee_id = $1
       ORDER BY a.applied_at DESC`,
      [employee_id]
    );

    res.status(200).json({
      applications: applicationsResult.rows,
    });
  } catch (error) {
    console.error('Error listing employee applications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getEmployeeId = async (user_id?: number): Promise<number | null> => {
  const result = await pool.query(
    'SELECT employee_id FROM employee WHERE user_id = $1',
    [user_id]
  );
  if (result.rows.length > 0) {
    return result.rows[0].employee_id;
  }
  return null;
};

const getEmployerId = async (user_id?: number): Promise<number | null> => {
  const result = await pool.query(
    'SELECT employer_id FROM employer WHERE user_id = $1',
    [user_id]
  );
  if (result.rows.length > 0) {
    return result.rows[0].employer_id;
  }
  return null;
};
