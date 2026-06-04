import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        description: String,
        category: {
            type: String,
            enum: ['email', 'report', 'general'],
            default: 'general'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model('SystemConfig', systemConfigSchema);
