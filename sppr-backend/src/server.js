import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import db from './config/db.js';
import projectRoutes from './routes/projectRoutes.js';
import alternativeRoutes from './routes/alternativeRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import criterionRoutes from './routes/criterionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import expertRoutes from './routes/expertRoutes.js';
import expertLogicRoutes from './routes/expertLogicRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.use('/api/projects', projectRoutes);
app.use('/api/alternatives', alternativeRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/criteria', criterionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/logic', expertLogicRoutes);

const startServer = async () => {
  db.getConnection()
    .then(() => {
      console.log('DB connected successfully');
    })
    .catch((error) => {
      console.error('DB connection failed:', error.message);
      process.exit(1);
    });
  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
};

startServer();
