import express from "express";
import {authenticateJWT, authorizeRoles} from "../middleware/auth";
import {getUserById} from "../controllers/user.controller3";
const router = express.Router();

router.get("/", authenticateJWT, getUserById);
export default router;
