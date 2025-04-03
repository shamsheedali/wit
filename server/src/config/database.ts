import mongoose from 'mongoose';
import dotenv from 'dotenv';
import log from '../utils/logger';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI!;

export const connectDB = async () => {
  try {
    const connect = await mongoose.connect(MONGO_URI);
    log.info(`MongoDB Connected: ${connect.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB Disconnected. Reconnecting...');
  connectDB(); // Attempt to reconnect
});

export default connectDB;
