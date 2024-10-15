import { Request, Response } from 'express';
import pool from '../utils/db';

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

const getEmployeeId = async (user_id?: number): Promise<number | null> => {
  const result = await pool.query(
    'SELECT employee_id FROM employees WHERE user_id = $1',
    [user_id]
  );
  if (result.rows.length > 0) {
    return result.rows[0].employee_id;
  }
  return null;
};
