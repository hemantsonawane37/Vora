import dotenv from 'dotenv';
dotenv.config(); // Must be first!

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import searchRoutes from './routes/searchRoutes';
import adminRoutes from './routes/adminRoutes';
import { initRedis } from './config/redis';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('DesignerHub API is running...');
});

import User from './models/User';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/designerhub');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Seed Admin User
        const userModel = User as any;
        if (userModel.seedAdmin) await userModel.seedAdmin();
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        // process.exit(1); // Don't crash on DB fail for now, allow mock search? No, DB essential usually.
    }
};

connectDB().then(async () => {
    console.log('Attempting to initialize Redis...');
    try {
        await initRedis();
        console.log('Redis initialization complete.');
    } catch (err) {
        console.error('Redis initialization failed, continuing without cache:', err);
    }

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (DesignerHub v2 - Real Data)`);
    });
});
