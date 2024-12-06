import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app'; // Import the app configuration

// Load environment variables
dotenv.config();

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!, {});
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process if DB connection fails
  }
}

// Call the function to connect to the database
connectToDatabase();

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
