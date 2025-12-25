import { Router } from 'express';
import { getDashboardStats, getScraperStatus } from '../controllers/adminController';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/scrapers', getScraperStatus);

import { getUsers, getReviewQueue, resolveReviewItem } from '../controllers/adminController';
router.get('/users', getUsers);
router.get('/review-queue', getReviewQueue);
router.post('/review-queue/:id/resolve', resolveReviewItem);

export default router;
