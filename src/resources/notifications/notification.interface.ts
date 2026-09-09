import { Document, Types } from 'mongoose';

export interface INotification extends Document {
    recipient: Types.ObjectId; // User ID
    title: string;
    message: string;
    category: 'Tag' | 'Incident' | 'Report' | 'Feedback' | 'Facility' | 'System' | 'Users' | 'Assignments';
    relatedId?: Types.ObjectId; // Optional related item ID (e.g., Tag ID)
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}