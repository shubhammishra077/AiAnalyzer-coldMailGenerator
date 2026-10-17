
const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null,
    };
}

const connectDB = async () => {
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
        throw new Error('MONGODB_URI is not configured');
    }

    if (!cached.promise) {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

        cached.promise = mongoose.connect(uri, {
            bufferCommands: false,
        }).catch((error) => {
            cached.promise = null;
            throw error;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
};

module.exports = connectDB;
