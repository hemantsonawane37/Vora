import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    role: 'admin' | 'user' | 'pro';
    status: 'active' | 'suspended';
    lastLogin: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'user', 'pro'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    lastLogin: { type: Date, default: Date.now }
});

// Create default admin if not exists
UserSchema.statics.seedAdmin = async function () {
    const admin = await this.findOne({ role: 'admin' });
    if (!admin) {
        await this.create({
            name: 'Hemant (Admin)',
            email: 'admin@designerhub.com',
            role: 'admin',
            status: 'active'
        });
        console.log('🌱 Seeded Admin User');
    }
};

export default mongoose.model<IUser>('User', UserSchema);
