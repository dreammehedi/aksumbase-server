import express from 'express';
import {
  getReview,
  getReviews,
  approveReview,
  editReview,
  deleteReview,
  reportReview
} from '../controllers/review.controller.js';

const router = express.Router();

router.get('/', getReview);
router.get('/reviews', getReviews);
router.put('/:id/approve', approveReview);
router.put('/:id/edit', editReview);
router.delete('/:id', deleteReview);
router.put('/:id/report', reportReview);

export default router; 