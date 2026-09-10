const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clothing_pos';
  
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${MONGODB_URI}: ${error.message}`);
    console.warn(`[MongoDB Warning] Server will continue operating with built-in in-memory fallback state.`);
    isConnected = false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
