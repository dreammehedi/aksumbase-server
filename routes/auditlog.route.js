import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { getAuditLogs } from '../controllers/post.controller.js';

const router = express.Router();

router.get('/', verifyToken, getAuditLogs);

export default router;
