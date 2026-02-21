import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api';
import { redisService } from './services/redis.service';
import { AnagramGroupModel } from './models';
import seed from './scripts/seed-anagram-groups';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Anaroo API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      submitScore: 'POST /api/submitScore',
      dailyLeaderboard: 'GET /api/leaderboard/daily',
      globalLeaderboard: 'GET /api/leaderboard/global',
      userRank: 'GET /api/leaderboard/user/:id',
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection and server startup
async function startServer() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/anaroo';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const count = await AnagramGroupModel.countDocuments();
    console.log(`Anagram groups in DB: ${count}`);
    if (count == 0) {
      console.log('Seeding database...');
      await seed();
    }

    // Connect to Redis
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      await redisService.connect(redisUrl);
    } else {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379');
      await redisService.connect(redisHost, redisPort);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  await redisService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  await redisService.disconnect();
  process.exit(0);
});

startServer();