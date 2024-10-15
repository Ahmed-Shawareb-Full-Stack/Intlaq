import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../utils/db';
import dotenv from 'dotenv';
import { Address } from '../models/address';
import { Ulid } from 'id128';
import { log } from 'console';

dotenv.config();

const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

export const registerEmployee = async (
  req: Request,
  res: Response
): Promise<void> => {
  log(req.body);

  const {
    national_id,
    name,
    address,
    email,
    password,
    bio,
    experience_level,
    programming_languages,
  } = req.body;

  const { details } = address as Address;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const countryResult = await client.query(
      'SELECT country_id FROM country WHERE country_id = $1',
      [address.country_id]
    );
    let country_id = countryResult.rows[0]?.country_id;

    if (!country_id) {
      res.status(400).json({ message: 'Country not found' });
      return;
    }

    const stateResult = await client.query(
      'SELECT state_id FROM state WHERE state_id = $1 AND country_id = $2',
      [address.state_id, country_id]
    );
    let state_id = stateResult.rows[0]?.state_id;

    if (!state_id) {
      res.status(400).json({ message: 'State not found' });
      return;
    }

    const cityResult = await client.query(
      'SELECT city_id FROM city WHERE city_id = $1 AND state_id = $2',
      [address.city_id, state_id]
    );
    let city_id = cityResult.rows[0]?.city_id;

    if (!city_id) {
      res.status(400).json({ message: 'City not found' });
      return;
    }

    log(programming_languages);

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

    const addressId = Ulid.generate().toRaw();

    log([addressId, country_id, state_id, city_id, details]);

    const addressResult = await client.query(
      'INSERT INTO address(address_id, country_id, state_id, city_id, details) VALUES($1, $2, $3, $4, $5) RETURNING address_id',
      [addressId, country_id, state_id, city_id, details]
    );

    const address_id = addressResult.rows[0].address_id;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userId = Ulid.generate().toRaw();

    const employeeId = Ulid.generate().toRaw();

    log([userId, name, 'EMPLOYEE', email, hashedPassword]);

    const emailCheckResult = await client.query(
      'SELECT COUNT(email) FROM users WHERE email = $1',
      [email]
    );

    if (parseInt(emailCheckResult.rows[0].count) > 0) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    const userResult = await client.query(
      `INSERT INTO users
        (user_id, name, type, email, hashed_password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id`,
      [userId, name, 'EMPLOYEE', email, hashedPassword]
    );

    const user_id = userResult.rows[0].user_id;

    log([
      employeeId,
      national_id,
      name,
      address_id,
      bio,
      experience_level,
      0,
      user_id,
    ]);

    const employeeResult = await client.query(
      `INSERT INTO employee 
        (employee_id, national_id, name, address_id, bio, experience_level, profile_views, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING employee_id`,
      [
        employeeId,
        national_id,
        name,
        address_id,
        bio,
        experience_level,
        0,
        user_id,
      ]
    );

    const employee_id = employeeResult.rows[0].employee_id;

    for (const language_id of programming_languages) {
      await client.query(
        'INSERT INTO employee_languages(employee_id, language_id) VALUES($1, $2) ON CONFLICT DO NOTHING',
        [employee_id, language_id]
      );
    }

    const token = jwt.sign({ employee_id }, process.env.JWT_SECRET as string, {
      expiresIn: '30d',
    });

    await client.query('COMMIT');

    res.status(201).json({ token });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registering employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const loginEmployee = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    const user = userResult.rows[0];

    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const employeeResult = await pool.query(
      'SELECT * FROM employee WHERE user_id = $1',
      [user.user_id]
    );
    const employee = employeeResult.rows[0];

    if (!employee) {
      res.status(400).json({ message: 'Employee not found' });
      return;
    }

    const token = jwt.sign(
      { user_id: employee.user_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
