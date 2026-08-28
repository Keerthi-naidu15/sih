const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error('MONGO_URI is not set. Add it in kisaan-backend/.env');
    }

    await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000
    });

    console.log('MongoDB connected');
};

module.exports = connectDB;
