import { Response } from 'express';
import Notification from './notification.model';
import { AuthUserRequest } from '../../middlewares/auth.middleware';

class NotificationController {
    /**
     * GET /api/notifications
     * Get all notifications for the authenticated user, with optional ?category= filter
     */
    public getNotifications = async (req: AuthUserRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const { category } = req.query;
            const query: any = { recipient: userId };
            if (category && category !== 'All') {
                query.category = category;
            }
            const notifications = await Notification.find(query).sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: notifications });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    };

    /**
     * GET /api/notifications/unread-count
     * Get the count of unread notifications (for the bell badge)
     */
    public getUnreadCount = async (req: AuthUserRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const count = await Notification.countDocuments({ recipient: userId, isRead: false });
            res.status(200).json({ success: true, count });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    };

    /**
     * PATCH /api/notifications/:id/read
     * Mark a single notification as read
     */
    public markAsRead = async (req: AuthUserRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const notification = await Notification.findOneAndUpdate(
                { _id: id, recipient: userId },
                { isRead: true },
                { new: true }
            );
            if (!notification) {
                res.status(404).json({ success: false, error: 'Notification not found' });
                return;
            }
            res.status(200).json({ success: true, data: notification });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    };

    /**
     * PATCH /api/notifications/read-all
     * Mark all notifications for the user as read
     */
    public markAllAsRead = async (req: AuthUserRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.userId;
            await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
            res.status(200).json({ success: true, message: 'All notifications marked as read' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
}

export default new NotificationController();
