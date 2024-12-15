import { Router } from 'express';
import { loadVerifiedUsers } from '../util/loadVerifiedUsers';

const router = Router();

router.get('/api/verified-users', (_req, res) => {
    const verifiedUsers = loadVerifiedUsers();
    res.json(verifiedUsers);
});

export default router;
