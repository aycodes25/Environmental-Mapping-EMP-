import serverless from "serverless-http";
import mongoose from "mongoose";
import app from "../index";
import config from "../config/variables";

let isConnected = false;
const MONGO_URL = config.MONGO_URL;

const connectDB = async () => {
  if (isConnected) {
    console.log("MongoDB already connected. Skipping re-initialization.");
    return;
  }

  try {
    await mongoose.connect(MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw new Error("Database connection failed");
  }
};

const handler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB();
  return serverless(app)(event, context);
};

export { handler };
