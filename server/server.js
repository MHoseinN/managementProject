import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import messageRoutes from './routes/messages.js';
import defenseRoutes from './routes/defense.js';
import managerRoutes from './routes/manager.js';
import reportRoutes from './routes/reports.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Connect to MongoDB (external/local)
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/managementProject';
console.log(`🔄 Connecting to MongoDB at: ${mongoUri}`);

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 3000,
  connectTimeoutMS: 5000,
  retryWrites: true,
  w: 'majority'
})
  .then(() => {
    console.log('✓ MongoDB connected successfully\n');
  })
  .catch(err => {
    console.warn('⚠️ MongoDB connection warning (API will work, but data won\'t persist)');
    console.warn(`   Error: ${err.message}\n`);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/defense', defenseRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/uploads', express.static(path.resolve('./uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`\n✓ Server running on http://localhost:${PORT}`));
