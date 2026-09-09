import Notification from './notification.model';
import User from '../users/user.model';
import { Types } from 'mongoose';

class NotificationService {
    /**
     * Create a notification for a specific user by their string userId
     */
    async notifyUser(
        recipientId: string | Types.ObjectId,
        title: string,
        message: string,
        category: string,
        relatedId?: string | Types.ObjectId
    ) {
        try {
            const notification = new Notification({
                recipient: recipientId,
                title,
                message,
                category,
                relatedId,
            });
            await notification.save();
            return notification;
        } catch (error) {
            console.error('NotificationService.notifyUser error:', error);
        }
    }

    /**
     * Create a notification for every user that has the given role
     */
    async notifyRole(
        role: string,
        title: string,
        message: string,
        category: string,
        relatedId?: string | Types.ObjectId
    ) {
        try {
            const users = await User.find({ role }).select('_id').lean();
            if (!users.length) return;
            const docs = users.map((u) => ({
                recipient: u._id,
                title,
                message,
                category,
                relatedId,
            }));
            await Notification.insertMany(docs);
        } catch (error) {
            console.error(`NotificationService.notifyRole (${role}) error:`, error);
        }
    }

    /**
     * Create a notification for multiple roles at once (deduplicates if a user has both roles)
     */
    async notifyRoles(
        roles: string[],
        title: string,
        message: string,
        category: string,
        relatedId?: string | Types.ObjectId
    ) {
        try {
            const users = await User.find({ role: { $in: roles } }).select('_id').lean();
            if (!users.length) return;
            const docs = users.map((u) => ({
                recipient: u._id,
                title,
                message,
                category,
                relatedId,
            }));
            await Notification.insertMany(docs);
        } catch (error) {
            console.error(`NotificationService.notifyRoles error:`, error);
        }
    }
}

export default new NotificationService();
