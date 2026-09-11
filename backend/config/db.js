const mongoose = require('mongoose');

let mongoServer = null;

/**
 * Connects the Express server to the MongoDB database using Mongoose.
 * Uses configuration parameters specified in environmental variables (.env).
 * If connection fails, it falls back to an in-memory MongoDB instance.
 */
const connectDB = async () => {
  try {
    console.log(`[Database] Attempting connection to MongoDB: ${process.env.MONGO_URI}...`);
    // Connect to primary URI with a 2-second timeout
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000
    });
    
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed signature rooms if empty
    const seedRooms = require('../utils/seedRooms');
    await seedRooms();
  } catch (error) {
    console.warn(`[Warning] Primary MongoDB connection failed: ${error.message}`);
    console.log(`[Database] Spinning up in-memory MongoDB Server fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      console.log(`[Database] In-memory MongoDB Server running at: ${inMemoryUri}`);
      
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`[Database] MongoDB Connected (In-Memory): ${conn.connection.host}`);
      
      // Auto-seed signature rooms
      const seedRooms = require('../utils/seedRooms');
      await seedRooms();
    } catch (innerError) {
      console.error(`[Error] Database connection & fallback failed: ${innerError.message}`);
      process.exit(1);
    }
  }
};

// Graceful shutdown hook for the in-memory server
process.on('SIGINT', async () => {
  if (mongoServer) {
    await mongoServer.stop();
    console.log('[Database] In-memory MongoDB Server stopped.');
  }
  process.exit(0);
});

module.exports = connectDB;

