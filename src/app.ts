import express from 'express';
import authRoutes from './routes/auth.routes'; // Import your routes

// Create an Express app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'Environmental Mapping Backend is running' });
});

// Application routes
app.use('/api/auth', authRoutes);

// Global error-handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'production' ? {} : err,
  });
});

// Export the configured app for use in index.ts
export default app;
