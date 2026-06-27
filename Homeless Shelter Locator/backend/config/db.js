const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the given connection string.
 * Kept as a separate module so tests can connect to an
 * in-memory MongoDB instance instead of a real one.
 */
async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${uri}`);
  return mongoose.connection;
}

module.exports = connectDB;