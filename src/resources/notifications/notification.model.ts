import mongoose, { Schema } from 'mongoose';
import { INotification } from './notification.interface';

const NotificationSchema: Schema = new Schema({
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: { 
        type: String, 
        enum: ['Tag', 'Incident', 'Report', 'Feedback', 'Facility', 'System', 'Users', 'Assignments'],
        required: true
    },
    relatedId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);