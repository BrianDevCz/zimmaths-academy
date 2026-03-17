// Fresh dashboard route 
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Dashboard API is working!' });
});

export default router;