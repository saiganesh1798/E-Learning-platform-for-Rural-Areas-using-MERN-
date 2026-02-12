const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
    try {
        let mongoUri = process.env.MONGO_URI;

        // Try to connect to local/provided URI first
        try {
            // Set a short timeout to fail fast if local mongo isn't running
            await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
            console.log('MongoDB Connected (Local/Atlas)');
        } catch (err) {
            console.log('Local MongoDB not found, starting In-Memory MongoDB...');
            const mongod = await MongoMemoryServer.create();
            mongoUri = mongod.getUri();
            await mongoose.connect(mongoUri);
            console.log(`MongoDB Connected (In-Memory) at ${mongoUri}`);
            console.log('NOTE: Data will reset when server restarts.');
        }

    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
