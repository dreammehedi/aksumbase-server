import express from 'express';
import { sendEstimateEmail } from '../controllers/email.controller.js';

const router = express.Router();

router.post('/estimate', sendEstimateEmail);

export default router;