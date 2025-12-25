import { Request, Response } from 'express';

import { getStats } from '../config/redis';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const realStats = await getStats();

        const stats = [
            { name: 'Total Searches', value: realStats.totalSearches.toLocaleString(), change: '+Active', type: 'increase' },
            { name: 'Active Users', value: realStats.totalUsers.toLocaleString(), change: '+5%', type: 'increase' },
            { name: 'Revenue', value: `$${realStats.revenue.toFixed(2)}`, change: '+Live', type: 'increase' },
            // Using a static latency for now as we didn't implement full latency tracking yet
            { name: 'Avg Latency', value: '120ms', change: '-2%', type: 'decrease' },
        ];
        res.json(stats);
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

import fetch from 'node-fetch';

export const getScraperStatus = async (req: Request, res: Response) => {
    // 1. Check Unsplash Status (Check if Key exists)
    const unsplashStatus = process.env.UNSPLASH_ACCESS_KEY ? 'healthy' : 'critical';

    // 2. Check AI Engine Status (Ping)
    let aiStatus = 'critical';
    let aiLatency = 'Timeout';
    try {
        const start = Date.now();
        const aiRes = await fetch('http://localhost:8000/');
        if (aiRes.ok) {
            aiStatus = 'healthy';
            aiLatency = `${Date.now() - start}ms`;
        }
    } catch (e) {
        aiStatus = 'critical';
    }

    const scrapers = [
        { name: 'Unsplash', status: unsplashStatus, latency: '120ms', errors: 0 },
        { name: 'AI Engine', status: aiStatus, latency: aiLatency, errors: 0 },
        { name: 'YouTube', status: 'warning', latency: '-', errors: 0 }, // Not connected
        { name: 'Freepik', status: 'warning', latency: '-', errors: 0 }, // Not connected
    ];
    res.json(scrapers);
};

import User from '../models/User';
import ReviewItem from '../models/ReviewItem';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

export const getReviewQueue = async (req: Request, res: Response) => {
    try {
        const items = await ReviewItem.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching review queue' });
    }
};

export const resolveReviewItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { approved } = req.body;

        await ReviewItem.findByIdAndUpdate(id, {
            status: approved ? 'approved' : 'rejected'
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error resolving item' });
    }
};
