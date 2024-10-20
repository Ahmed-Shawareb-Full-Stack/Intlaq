import {AuthRequest} from "../middleware/auth";
import {User} from "../models/user";
import pool from "../utils/db";
import {Request, Response} from "express";

export const getUserById = async (req: AuthRequest, res: Response) => {
  res.status(200).json({user: req.user});
};
