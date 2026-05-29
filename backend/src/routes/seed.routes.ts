import { Router } from 'express';
import { seedData } from '../scripts/seedData';

const router = Router();

// POST /api/seed - Re-seed the database
router.post('/', async (req, res) => {
  try {
    await seedData();
    res.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seeding failed:', error);
    res.status(500).json({ error: 'Failed to seed database' });
  }
});

export default router;