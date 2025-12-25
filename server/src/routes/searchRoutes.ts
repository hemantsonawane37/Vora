import { Router } from 'express';
import { searchAssets } from '../controllers/searchController';

const router = Router();

// GET /api/search?q=...
router.get('/', searchAssets);

export default router;
