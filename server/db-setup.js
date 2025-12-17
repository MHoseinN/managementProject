import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const startMongoDB = async () => {
  if (process.env.MONGODB_URI) {
    console.log('✓ Using external MongoDB URI from environment');
    return;
  }

  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    console.log('✓ MongoDB Memory Server started');
    console.log(`  URI: ${mongoUri}`);
  } catch (error) {
    console.warn('⚠️ Could not start MongoDB Memory Server:', error.message);
    console.log('💡 Continuing without database...');
  }
};

export const stopMongoDB = async () => {
  if (mongoServer) {
    await mongoServer.stop();
    console.log('✓ MongoDB Memory Server stopped');
  }
};
