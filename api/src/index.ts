import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import topicsRouter from './routes/topics';
import authRouter from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/topics', topicsRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ZimMaths Academy API'
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'ZimMaths Academy API is running! 🚀',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ ZimMaths API running on http://localhost:${PORT}`);
});

export default app;
