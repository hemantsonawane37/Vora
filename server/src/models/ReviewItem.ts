import mongoose, { Schema, Document } from 'mongoose';

export interface IReviewItem extends Document {
    term: string;
    image: string;
    source: string;
    confidence: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
}

const ReviewItemSchema: Schema = new Schema({
    term: { type: String, required: true },
    image: { type: String, required: true },
    source: { type: String, required: true },
    confidence: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IReviewItem>('ReviewItem', ReviewItemSchema);
